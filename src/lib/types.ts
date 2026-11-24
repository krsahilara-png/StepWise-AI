export interface Step {
  id: number;
  /** Database row id — present on guides loaded from Supabase, absent on sample data. */
  dbId?: string;
  title: string;
  instruction: string;
  /** Placeholder until real reference images exist (later milestone). */
  hasReferenceImage: boolean;
  /** Storage path of the step's uploaded photo; null until one is uploaded. */
  referenceImagePath: string | null;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  totalSteps: number;
  completedSteps: number;
  updatedAt: string;
  steps: Step[];
}

export interface CompletedGuide {
  id: string;
  title: string;
  category: string;
  completedAt: string;
  totalSteps: number;
}
