import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ImageIcon,
  Info,
  Loader2,
  PartyPopper,
  RotateCcw,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import {
  deleteStepProgress,
  fetchGuideWithSteps,
  saveStepProgress,
} from '../lib/guides';
import type { Guide, Step } from '../lib/types';
import {
  createSignedImageUrl,
  removeStepImage,
  uploadStepImage,
} from '../lib/guides';
import ProgressBar from '../components/ProgressBar';

interface Props {
  guideId: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; guide: Guide; completedStepIds: Set<number> };

export default function GuidePage({ guideId }: Props) {
  const { navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchGuideWithSteps(guideId)
      .then((result) => {
        if (!cancelled) {
          setState(
            result
              ? { status: 'ready', guide: result.guide, completedStepIds: result.completedStepIds }
              : { status: 'error', message: 'This guide does not exist or belongs to another account.' },
          );
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Something went wrong.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  if (state.status === 'loading') {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary" />
            <p className="text-sm text-neutral-500">Loading guide…</p>
          </div>
        </div>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="flex-1 px-4 py-20 text-center">
        <p className="text-neutral-500">{state.message}</p>
        <button onClick={() => navigate({ name: 'home' })} className="btn-primary mt-6">
          Back to home
        </button>
      </main>
    );
  }

  return (
    <GuideRunner
      key={guideId}
      guide={state.guide}
      initialCompletedIds={state.completedStepIds}
    />
  );
}

function GuideRunner({
  guide: initialGuide,
  initialCompletedIds,
}: {
  guide: Guide;
  initialCompletedIds: Set<number>;
}) {
  const { navigate } = useRouter();
  const [guide, setGuide] = useState<Guide>(initialGuide);
  const [currentStep, setCurrentStep] = useState(() => {
    const firstIncomplete = guide.steps.findIndex((s) => !initialCompletedIds.has(s.id));
    return firstIncomplete === -1 ? Math.max(0, guide.steps.length - 1) : firstIncomplete;
  });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(initialCompletedIds);
  const [progressError, setProgressError] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  const toggleComplete = async () => {
    const stepDbId = step.dbId;
    if (!stepDbId || savingProgress) return;

    const wasComplete = completedSteps.has(step.id);
    // Optimistic update; revert if the database write fails.
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (wasComplete) next.delete(step.id);
      else next.add(step.id);
      return next;
    });
    setSavingProgress(true);
    setProgressError('');

    try {
      if (wasComplete) {
        await deleteStepProgress(stepDbId);
      } else {
        await saveStepProgress(stepDbId);
      }
    } catch (err) {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        if (wasComplete) next.add(step.id);
        else next.delete(step.id);
        return next;
      });
      setProgressError(
        err instanceof Error
          ? err.message
          : 'Could not save your progress. Please try again.',
      );
    } finally {
      setSavingProgress(false);
    }
  };

  const restart = () => {
    setCompletedSteps(new Set());
    setCurrentStep(0);
    setProgressError('');
  };

  if (guide.steps.length === 0) {
    return (
      <main className="flex-1 px-4 py-20 text-center">
        <p className="text-neutral-500">This guide has no steps yet.</p>
        <button onClick={() => navigate({ name: 'home' })} className="btn-primary mt-6">
          Back to home
        </button>
      </main>
    );
  }

  const step = guide.steps[currentStep];
  const stepDbId = step.dbId;
  const imagePath = step.referenceImagePath ?? null;
  const isLast = currentStep === guide.steps.length - 1;
  const isComplete = completedSteps.has(step.id);
  const allDone = completedSteps.size === guide.steps.length;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          My guides
        </button>

        {allDone ? (
          <CompletionScreen guide={guide} onRestart={restart} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="tag">Step {currentStep + 1} of {guide.steps.length}</span>
                <span className="text-xs font-medium text-neutral-400">
                  {completedSteps.size} completed
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {guide.title}
              </h1>
              <ProgressBar
                percent={Math.round((completedSteps.size / guide.steps.length) * 100)}
                className="mt-4"
              />
            </div>

            {/* Step card */}
            <div className="card p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors ${
                    isComplete ? 'bg-emerald-500 text-white' : 'bg-black text-primary'
                  }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : step.id}
                </span>
                <h2 className="text-xl font-bold text-neutral-900">{step.title}</h2>
              </div>

              <p className="text-base leading-relaxed text-neutral-600">{step.instruction}</p>

              <StepImageSection
                key={step.id}
                guideId={guide.id}
                step={step}
                onStepChange={(updated) =>
                  setGuide((prev) => ({
                    ...prev,
                    steps: prev.steps.map((s) => (s.id === updated.id ? updated : s)),
                  }))
                }
              />

              {isComplete && !progressError && (
                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Step complete — nice work
                </div>
              )}

              {progressError && (
                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <Info className="h-4 w-4 shrink-0" />
                  {progressError}
                </div>
              )}

            </div>

            {/* Navigation */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="btn-ghost sm:order-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {!isComplete ? (
                <button onClick={toggleComplete} disabled={savingProgress} className="btn-primary flex-1 sm:order-3">
                  <Check className="h-4 w-4" />
                  Mark step complete
                </button>
              ) : (
                <button
                  onClick={toggleComplete}
                  disabled={savingProgress}
                  className="btn-ghost flex-1 sm:order-3"
                >
                  <RotateCcw className="h-4 w-4" />
                  Unmark step
                </button>
              )}

              <button
                onClick={() => setCurrentStep((s) => Math.min(guide.steps.length - 1, s + 1))}
                disabled={isLast}
                className="btn-ghost sm:order-2"
              >
                Next
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StepImageSection({
  guideId,
  step,
  onStepChange,
}: {
  guideId: string;
  step: Step;
  onStepChange: (updated: Step) => void;
}) {
  const imagePath = step.referenceImagePath;
    const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
      const startCamera = async () => {
    setCameraError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      document.getElementById(`camera-input-${step.id}`)?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Unable to access the camera.',
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);
  const [imageState, setImageState] = useState<{
    url: string | null;
    loading: boolean;
    uploading: boolean;
    error: string;
  }>(() => ({
    url: null,
    loading: Boolean(imagePath),
    uploading: false,
    error: '',
  }));

    const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet. Please wait.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('Unable to capture the photo.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setCameraError('Failed to capture the photo.');
          return;
        }

        const file = new File(
          [blob],
          `camera-capture-${Date.now()}.jpg`,
          { type: 'image/jpeg' },
        );

        stopCamera();
        await uploadSelectedFile(file);
      },
      'image/jpeg',
      0.9,
    );
  };
  
  useEffect(() => {
    if (!imagePath) {
      setImageState({ url: null, loading: false, uploading: false, error: '' });
      return;
    }
    let cancelled = false;
    setImageState((prev) => ({ ...prev, url: null, loading: true, error: '' }));
    createSignedImageUrl(imagePath)
      .then((url) => {
        if (!cancelled) setImageState((prev) => ({ ...prev, url, loading: false }));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setImageState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : 'Could not load the image for this step.',
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [imagePath]);

    const uploadSelectedFile = async (file: File) => {
    const stepDbId = step.dbId;
    if (!stepDbId || imageState.uploading) return;

    if (!file.type.startsWith('image/')) {
      setImageState((prev) => ({
        ...prev,
        error: 'Please choose an image file (JPEG, PNG, or WebP).',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageState((prev) => ({
        ...prev,
        error: 'That image is too large. Please pick one under 10 MB.',
      }));
      return;
    }

    setImageState((prev) => ({ ...prev, uploading: true, error: '' }));

    try {
      const result = await uploadStepImage(guideId, stepDbId, file);

      onStepChange({
        ...step,
        referenceImagePath: result.path,
        hasReferenceImage: true,
      });

      setImageState({
        url: result.signedUrl,
        loading: false,
        uploading: false,
        error: '',
      });
    } catch (err) {
      setImageState((prev) => ({
        ...prev,
        uploading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Could not upload the image. Please try again.',
      }));
    }
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      await uploadSelectedFile(file);
    }
  };

  const handleRemoveImage = async () => {
    const stepDbId = step.dbId;
    if (!stepDbId || !imagePath || imageState.uploading) return;
    setImageState((prev) => ({ ...prev, uploading: true, error: '' }));
    try {
      await removeStepImage(guideId, stepDbId, imagePath);
      onStepChange({ ...step, referenceImagePath: null, hasReferenceImage: false });
      setImageState({ url: null, loading: false, uploading: false, error: '' });
    } catch (err) {
      setImageState((prev) => ({
        ...prev,
        uploading: false,
        error: err instanceof Error ? err.message : 'Could not remove the image. Please try again.',
      }));
    }
  };

  const cameraUi = (
    <>
      <input
        id={`file-input-${step.id}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        id={`camera-input-${step.id}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={startCamera}
          disabled={imageState.uploading}
          className="btn-ghost flex-col !gap-1 !py-4"
        >
          <Camera className="h-5 w-5 text-accent-blue" />
          Camera capture
        </button>
        <button
          type="button"
          onClick={() => document.getElementById(`file-input-${step.id}`)?.click()}
          disabled={imageState.uploading}
          className="btn-ghost flex-col !gap-1 !py-4"
        >
          <Upload className="h-5 w-5 text-accent-violet" />
          Upload photo
        </button>
      </div>

      {cameraError && !cameraOpen && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Info className="h-4 w-4 shrink-0" />
          {cameraError}
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-neutral-900">Take a photo</h3>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-[65vh] w-full rounded-xl bg-black object-contain"
            />

            {cameraError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {cameraError}
              </div>
            )}

            <button
              type="button"
              onClick={capturePhoto}
              className="btn-primary mt-4 w-full"
            >
              <Camera className="h-4 w-4" />
              Capture photo
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (imageState.uploading) {
    return (
      <>
        {cameraUi}
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-accent-blue" />
          <p className="text-sm font-medium text-neutral-600">Saving your photo…</p>
        </div>
      </>
    );
  }

  if (imageState.url) {
    return (
      <>
        {cameraUi}
        <div className="relative mt-6">
          <img
            src={imageState.url}
            alt={`Photo for step ${step.id}: ${step.title}`}
            className="max-h-96 w-full rounded-2xl border border-neutral-200 object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition hover:bg-white hover:text-red-600"
            aria-label="Remove photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {imageState.error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <Info className="h-4 w-4 shrink-0" />
            {imageState.error}
          </div>
        )}
      </>
    );
  }

  if (imageState.loading) {
    return (
      <>
        {cameraUi}
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-accent-blue" />
          <p className="text-sm font-medium text-neutral-600">Loading image…</p>
        </div>
      </>
    );
  }

  return (
    <>
      {cameraUi}
      <button
        type="button"
        onClick={() => document.getElementById(`file-input-${step.id}`)?.click()}
        className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center transition hover:border-accent-blue/40 hover:bg-accent-blue/5"
      >
        <ImageIcon className="mb-2 h-8 w-8 text-accent-blue" />
        <p className="text-sm font-medium text-neutral-600">Add a photo to this step</p>
        <p className="mt-1 text-xs text-neutral-400">
          Show where you are up to — JPEG, PNG or WebP, up to 10 MB
        </p>
      </button>
      {imageState.error && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Info className="h-4 w-4 shrink-0" />
          {imageState.error}
        </div>
      )}
    </>
  );
}

function CompletionScreen({
  guide,
  onRestart,
}: {
  guide: Guide;
  onRestart: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <PartyPopper className="h-10 w-10 text-emerald-500" />
      </span>
      <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Guide complete!</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        You finished all {guide.steps.length} steps of{' '}
        <span className="font-semibold text-neutral-900">{guide.title}</span>.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary">
        <Trophy className="h-4 w-4" />
        +50 XP earned
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button onClick={() => navigate({ name: 'dashboard' })} className="btn-primary">
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={onRestart} className="btn-ghost">
          <RotateCcw className="h-4 w-4" />
          Restart guide
        </button>
      </div>
    </div>
  );
}
