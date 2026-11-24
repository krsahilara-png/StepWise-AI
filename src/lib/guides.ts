import { supabase } from './supabase';
import type { Guide, Step } from './types';

const IMAGE_BUCKET = 'guide-images';
const MAX_IMAGE_DIMENSION = 1280;
const IMAGE_MIME = 'image/jpeg';

interface DbGuideRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  updated_at: string;
}

interface DbStepRow {
  id: string;
  guide_id: string;
  position: number;
  title: string;
  instruction: string;
  reference_image_url: string | null;
}

interface DbProgressRow {
  step_id: string;
}

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const startOfThen = new Date(iso).setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - startOfThen) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function toUiGuide(
  row: DbGuideRow,
  steps: DbStepRow[],
  completedStepIds: Set<number>,
): Guide {
  const uiSteps: Step[] = steps
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      id: s.position,
      dbId: s.id,
      title: s.title,
      instruction: s.instruction,
      hasReferenceImage: Boolean(s.reference_image_url),
      referenceImagePath: s.reference_image_url,
    }));

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? 'Uncategorized',
    tags: [],
    totalSteps: uiSteps.length,
    completedSteps: uiSteps.filter((s) => completedStepIds.has(s.id)).length,
    updatedAt: formatRelativeDate(row.updated_at),
    steps: uiSteps,
  };
}

/** All of the signed-in user's guides with their steps and progress (RLS-scoped). */
export async function fetchUserGuides(): Promise<Guide[]> {
  const { data: guideRows, error: guidesError } = await supabase
    .from('guides')
    .select('id, title, description, category, status, updated_at')
    .order('updated_at', { ascending: false });

  if (guidesError) throw new Error(guidesError.message);
  if (!guideRows || guideRows.length === 0) return [];

  const guideIds = guideRows.map((g) => (g as DbGuideRow).id);

  const { data: stepRows, error: stepsError } = await supabase
    .from('guide_steps')
    .select('id, guide_id, position, title, instruction, reference_image_url')
    .in('guide_id', guideIds)
    .order('position', { ascending: true });

  if (stepsError) throw new Error(stepsError.message);

  const { data: progressRows, error: progressError } = await supabase
    .from('guide_step_progress')
    .select('step_id');

  if (progressError) throw new Error(progressError.message);

  const stepIdToPosition = new Map(
    (stepRows ?? []).map((s) => [(s as DbStepRow).id, (s as DbStepRow).position]),
  );
  const completedPositions = new Set(
    (progressRows ?? [])
      .map((p) => stepIdToPosition.get((p as DbProgressRow).step_id))
      .filter((pos): pos is number => pos !== undefined),
  );

  return guideRows.map((row) => {
    const g = row as DbGuideRow;
    const steps = (stepRows ?? []).filter((s) => (s as DbStepRow).guide_id === g.id);
    return toUiGuide(g, steps, completedPositions);
  });
}

/** Completed step positions (1-based) for one guide. */
export async function fetchCompletedStepPositions(guideId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('guide_step_progress')
    .select('step_id, guide_steps!inner(position)')
    .eq('guide_steps.guide_id', guideId);

  if (error) throw new Error(error.message);

  return new Set(
    (data ?? []).map(
      (row) => (row as unknown as { guide_steps: { position: number } }).guide_steps.position,
    ),
  );
}

export interface GuideWithProgress {
  guide: Guide;
  completedStepIds: Set<number>;
}

export interface NewStepInput {
  title: string;
  instruction: string;
}

export interface CreateGuideInput {
  title: string;
  description: string;
  category?: string;
  steps: NewStepInput[];
}

export interface CreateGuideResult {
  guideId: string;
}

/**
 * Calls the deployed generate-guide edge function. Generation and insertion
 * happen server-side using the caller's JWT (RLS applies) and a server-held
 * Gemini key — the browser never talks to the AI provider directly.
 */
export async function generateGuideWithAi(taskName: string, description: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ taskName, description }),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // handled by the guards below
  }

  if (!response.ok) {
    const message =
      body !== null &&
      typeof body === 'object' &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  const guideId =
    body !== null &&
    typeof body === 'object' &&
    'guideId' in body &&
    typeof (body as { guideId: unknown }).guideId === 'string'
      ? (body as { guideId: string }).guideId
      : '';
  if (!guideId) {
    throw new Error('The guide was created but no ID came back. Check your dashboard.');
  }
  return guideId;
}

/**
 * Records the signed-in user completing a step. Duplicate completions are
 * prevented at the database level by a unique (user_id, step_id) constraint;
 * this treats "already exists" as success so re-tapping is harmless.
 */
export async function saveStepProgress(stepDbId: string): Promise<void> {
  const { error } = await supabase
    .from('guide_step_progress')
    .insert({ step_id: stepDbId });

  if (error && error.code !== '23505') {
    throw new Error(error.message);
  }
}

/** Removes the signed-in user's completion record for a step. */
export async function deleteStepProgress(stepDbId: string): Promise<void> {
  const { error } = await supabase
    .from('guide_step_progress')
    .delete()
    .eq('step_id', stepDbId);

  if (error) throw new Error(error.message);
}

/**
 * Creates a guide and its ordered steps for the signed-in user.
 * If step insertion fails, the half-created guide is deleted (cascade removes
 * any steps that made it in) so no empty guide is left behind.
 */
export async function createGuideWithSteps(
  input: CreateGuideInput,
): Promise<CreateGuideResult> {
  const { data: guideData, error: guideError } = await supabase
    .from('guides')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category ?? null,
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (guideError) throw new Error(guideError.message);
  if (!guideData) throw new Error('Guide creation returned no data.');
  const guideId = (guideData as { id: string }).id;

  const { error: stepsError } = await supabase.from('guide_steps').insert(
    input.steps.map((step, index) => ({
      guide_id: guideId,
      position: index + 1,
      title: step.title,
      instruction: step.instruction,
    })),
  );

  if (stepsError) {
    await supabase.from('guides').delete().eq('id', guideId);
    throw new Error(`Could not save the steps: ${stepsError.message}`);
  }

  return { guideId };
}

/** One guide with its ordered steps and the user's completed steps, or null if not found. */
export async function fetchGuideWithSteps(guideId: string): Promise<GuideWithProgress | null> {
  const { data: guideData, error: guideError } = await supabase
    .from('guides')
    .select('id, title, description, category, status, updated_at')
    .eq('id', guideId)
    .maybeSingle();

  if (guideError) throw new Error(guideError.message);
  if (!guideData) return null;

  const guideRow = guideData as DbGuideRow;

  const { data: stepRows, error: stepsError } = await supabase
    .from('guide_steps')
    .select('id, guide_id, position, title, instruction, reference_image_url')
    .eq('guide_id', guideId)
    .order('position', { ascending: true });

  if (stepsError) throw new Error(stepsError.message);

  const steps = (stepRows ?? []) as DbStepRow[];

  const { data: progressRows, error: progressError } = await supabase
    .from('guide_step_progress')
    .select('step_id')
    .in(
      'step_id',
      steps.map((s) => s.id),
    );

  if (progressError) throw new Error(progressError.message);

  const stepIdToPosition = new Map(steps.map((s) => [s.id, s.position]));
  const completedStepIds = new Set(
    (progressRows ?? [])
      .map((p) => stepIdToPosition.get((p as DbProgressRow).step_id))
      .filter((pos): pos is number => pos !== undefined),
  );

  return { guide: toUiGuide(guideRow, steps, completedStepIds), completedStepIds };
}

interface UploadStepImageResult {
  path: string;
  signedUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file does not look like a valid image.'));
    img.src = dataUrl;
  });
}

/** Downscales to fit within MAX_IMAGE_DIMENSION and re-encodes as JPEG. */
async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      IMAGE_MIME,
      0.85,
    );
  });
}

/**
 * Compresses, uploads, and attaches a photo to a guide step for the signed-in
 * user. One image per step: any previous photo is deleted from storage before
 * the new one is uploaded, and the step row is updated last so the visible
 * state never points at a missing file. Returns a fresh signed URL for display.
 */
export async function uploadStepImage(
  guideId: string,
  stepDbId: string,
  file: File,
): Promise<UploadStepImageResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Your session has expired. Please sign in again.');

  const blob = await compressImage(file);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const path = `${userId}/${guideId}/${stepDbId}/${fileName}`;

  const { data: existing, error: listError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .list(`${userId}/${guideId}/${stepDbId}`);
  if (listError) throw new Error(listError.message);

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, blob, { contentType: IMAGE_MIME, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from('guide_steps')
    .update({ reference_image_url: path })
    .eq('id', stepDbId);

  if (updateError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    throw new Error(updateError.message);
  }

  const staleObjects = (existing ?? [])
    .map((o) => `${userId}/${guideId}/${stepDbId}/${o.name}`)
    .filter((p) => p !== path);
  if (staleObjects.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(staleObjects);
  }

  const { data: urlData, error: urlError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (urlError || !urlData) throw new Error(urlError?.message ?? 'Image uploaded, but the preview could not be loaded. Reopen the guide to see it.');

  return { path, signedUrl: urlData.signedUrl };
}

/** Creates a short-lived signed URL for a step's stored image path. */
export async function createSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not load the image for this step.');
  }
  return data.signedUrl;
}

/** Removes a step's photo from storage and clears its reference. */
export async function removeStepImage(
  guideId: string,
  stepDbId: string,
  path: string,
): Promise<void> {
  const { error: updateError } = await supabase
    .from('guide_steps')
    .update({ reference_image_url: null })
    .eq('id', stepDbId);
  if (updateError) throw new Error(updateError.message);

  const { error: removeError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .remove([path]);
  if (removeError) throw new Error(removeError.message);
}
