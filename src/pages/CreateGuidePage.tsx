import { useState } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { createGuideWithSteps, generateGuideWithAi } from '../lib/guides';

interface StepDraft {
  title: string;
  instruction: string;
}

const emptyStep: StepDraft = { title: '', instruction: '' };

export default function CreateGuidePage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([{ ...emptyStep }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [aiTaskName, setAiTaskName] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStep = () => setSteps((prev) => [...prev, { ...emptyStep }]);

  const removeStep = (index: number) => {
    setSteps((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setSteps((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleCreate = async () => {
    setError('');

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const cleanedSteps = steps
      .map((s) => ({ title: s.title.trim(), instruction: s.instruction.trim() }))
      .filter((s) => s.title.length > 0 || s.instruction.length > 0);

    if (!trimmedTitle) {
      setError('Please give your guide a title.');
      return;
    }
    if (cleanedSteps.length === 0 || !cleanedSteps.some((s) => s.title)) {
      setError('Please add at least one step with a title.');
      return;
    }
    if (cleanedSteps.some((s) => !s.title)) {
      setError('Every step needs a title (empty steps are ignored).');
      return;
    }

    if (!user) {
      setError('You need to be signed in to create a guide.');
      return;
    }

    setSaving(true);
    try {
      const { guideId } = await createGuideWithSteps({
        title: trimmedTitle,
        description: trimmedDescription,
        steps: cleanedSteps,
      });
      navigate({ name: 'guide', guideId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setAiError('');

    const trimmedTaskName = aiTaskName.trim();
    if (!trimmedTaskName) {
      setAiError('Please describe the task you want a guide for.');
      return;
    }
    if (!user) {
      setAiError('You need to be signed in to generate a guide.');
      return;
    }

    setGenerating(true);
    try {
      const guideId = await generateGuideWithAi(trimmedTaskName, aiDescription.trim());
      navigate({ name: 'guide', guideId });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
      setGenerating(false);
    }
  };

  if (saving || generating) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary" />
            <p className="text-sm text-neutral-500">
              {generating ? 'Generating your guide…' : 'Creating your guide…'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Create a new guide
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Break your task into clear steps you can follow one at a time. You can
          reorder or remove steps before saving.
        </p>

        <div className="card mt-8 space-y-6 p-6 border-primary/30 bg-gradient-to-b from-primary-50/50 to-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-neutral-900">Generate with AI</h2>
          </div>
          <p className="-mt-4 text-xs leading-relaxed text-neutral-500">
            Describe the task and AI drafts the steps for you. You can still edit
            everything after it&apos;s created.
          </p>

          <div>
            <label htmlFor="ai-task-name" className="mb-2 block text-sm font-semibold text-neutral-900">
              What task is this guide for?
            </label>
            <input
              id="ai-task-name"
              type="text"
              value={aiTaskName}
              onChange={(e) => setAiTaskName(e.target.value)}
              disabled={generating}
              placeholder="e.g. Change a flat tire"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="ai-description" className="mb-2 block text-sm font-semibold text-neutral-900">
              Extra context <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="ai-description"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              disabled={generating}
              rows={2}
              placeholder="e.g. For a beginner, on a car with standard lug nuts"
              className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {aiError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                {aiError}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="ml-2 font-semibold underline underline-offset-2 hover:text-amber-900"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || saving}
            className="btn-primary w-full !py-3.5"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate guide with AI
              </>
            )}
          </button>
        </div>

        <div className="card mt-6 space-y-6 p-6">
          <div>
            <label htmlFor="guide-title" className="mb-2 block text-sm font-semibold text-neutral-900">
              Guide title
            </label>
            <input
              id="guide-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Change a flat tire"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="guide-description" className="mb-2 block text-sm font-semibold text-neutral-900">
              Description <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="guide-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this guide teach?"
              className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">Steps</span>
              <span className="text-xs text-neutral-400">{steps.length} step{steps.length === 1 ? '' : 's'}</span>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="rounded-xl border border-neutral-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move step ${index + 1} up`}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        aria-label={`Move step ${index + 1} down`}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        disabled={steps.length === 1}
                        aria-label={`Remove step ${index + 1}`}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, { title: e.target.value })}
                    placeholder={`Step ${index + 1} title, e.g. "Loosen the nuts"`}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(index, { instruction: e.target.value })}
                    rows={2}
                    placeholder="What exactly should you do in this step?"
                    className="mt-2 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-sm leading-relaxed text-neutral-700 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:border-primary hover:bg-primary-50/40 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add another step
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full !py-3.5">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create guide
              </>
            )}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
            <ImageIcon className="h-3 w-3" />
            Images and videos can be attached to steps in a later milestone.
          </p>
        </div>
      </div>
    </main>
  );
}
