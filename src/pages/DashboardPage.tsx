import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Plus,
  Trophy,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { fetchUserGuides } from '../lib/guides';
import type { Guide } from '../lib/types';
import GuideCard from '../components/GuideCard';
import ProgressBar from '../components/ProgressBar';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; guides: Guide[] };

export default function DashboardPage() {
  const { navigate } = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchUserGuides()
      .then((guides) => {
        if (!cancelled) setState({ status: 'ready', guides });
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
  }, []);

  if (state.status === 'loading') {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-primary" />
            <p className="text-sm text-neutral-500">Loading your guides…</p>
          </div>
        </div>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="card mx-auto max-w-md p-8 text-center">
            <p className="font-semibold text-neutral-900">Couldn't load your guides</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{state.message}</p>
            <button
              onClick={() => setState({ status: 'loading' })}
              className="btn-primary mt-6"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const guides = state.guides;
  const inProgress = guides.filter((g) => g.completedSteps < g.totalSteps);
  const finished = guides.filter((g) => g.totalSteps > 0 && g.completedSteps === g.totalSteps);

  const totalStepsDone = guides.reduce((sum, g) => sum + g.completedSteps, 0);
  const streak = 4;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Your learning at a glance — keep the streak going
            </p>
          </div>
          <button onClick={() => navigate({ name: 'create' })} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create new guide
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card p-5">
            <BookOpen className="mb-3 h-5 w-5 text-accent-blue" />
            <p className="text-2xl font-bold text-neutral-900">{guides.length}</p>
            <p className="text-xs font-medium text-neutral-500">Created guides</p>
          </div>
          <div className="card p-5">
            <ArrowRight className="mb-3 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-neutral-900">{inProgress.length}</p>
            <p className="text-xs font-medium text-neutral-500">In progress</p>
          </div>
          <div className="card p-5">
            <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-500" />
            <p className="text-2xl font-bold text-neutral-900">{finished.length}</p>
            <p className="text-xs font-medium text-neutral-500">Completed</p>
          </div>
          <div className="card p-5">
            <Flame className="mb-3 h-5 w-5 text-accent-violet" />
            <p className="text-2xl font-bold text-neutral-900">
              {streak} <span className="text-sm font-medium text-neutral-400">days</span>
            </p>
            <p className="text-xs font-medium text-neutral-500">Learning streak</p>
          </div>
        </div>

        {/* Continue learning */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-neutral-900">Continue learning</h2>
          {inProgress.length > 0 ? (
            <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <span className="tag mb-2">Up next</span>
                <h3 className="text-lg font-bold text-neutral-900">{inProgress[0].title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
                  {inProgress[0].description}
                </p>
                <div className="mt-4 max-w-sm">
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-neutral-500">
                    <span>Step {inProgress[0].completedSteps} of {inProgress[0].totalSteps}</span>
                    <span>
                      {inProgress[0].totalSteps === 0
                        ? 0
                        : Math.round(
                            (inProgress[0].completedSteps / inProgress[0].totalSteps) * 100,
                          )}
                      %
                    </span>
                  </div>
                  <ProgressBar
                    percent={
                      inProgress[0].totalSteps === 0
                        ? 0
                        : Math.round(
                            (inProgress[0].completedSteps / inProgress[0].totalSteps) * 100,
                          )
                    }
                  />
                </div>
              </div>
              <button
                onClick={() => navigate({ name: 'guide', guideId: inProgress[0].id })}
                className="btn-primary shrink-0"
              >
                Continue learning
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-neutral-500">
              {guides.length === 0
                ? 'No guides yet — create your first guide to get started.'
                : 'Nothing in progress right now.'}
            </div>
          )}
        </section>

        {/* Created guides */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-neutral-900">Created guides</h2>
          {guides.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-semibold text-neutral-900">No guides yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
                Guides you create will show up here so you can track your progress.
              </p>
              <button onClick={() => navigate({ name: 'create' })} className="btn-primary mt-6">
                <Plus className="h-4 w-4" />
                Create new guide
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          )}
        </section>

        {/* Completed guides */}
        <section className="mt-10 pb-4">
          <h2 className="mb-4 text-xl font-bold text-neutral-900">Completed guides</h2>
          {finished.length === 0 ? (
            <div className="card p-8 text-center text-sm text-neutral-500">
              No completed guides yet — finish one to see it here.
            </div>
          ) : (
            <div className="card divide-y divide-neutral-100">
              {finished.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => navigate({ name: 'guide', guideId: guide.id })}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Trophy className="h-5 w-5 text-emerald-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-900">{guide.title}</p>
                    <p className="text-sm text-neutral-500">
                      {guide.category} · {guide.totalSteps} steps
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-neutral-400">
                    {guide.updatedAt}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
                </button>
              ))}
            </div>
          )}
        </section>

        {guides.length > 0 && (
          <p className="mt-4 text-center text-xs text-neutral-400">
            {totalStepsDone} steps completed so far — keep it up
          </p>
        )}
      </div>
    </main>
  );
}
