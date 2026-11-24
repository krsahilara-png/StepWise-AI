
import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  Footprints,
  ListChecks,
  Play,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from '../lib/router';
import { fetchUserGuides } from '../lib/guides';
import type { Guide } from '../lib/types';
import GuideCard from '../components/GuideCard';

const features = [
  {
    icon: ListChecks,
    title: 'Step-by-step guides',
    text: 'Any task broken into clear, doable steps — never a wall of text.',
    iconClass: 'text-primary',
  },
  {
    icon: Camera,
    title: 'Visual references',
    text: 'Attach photos to each step and capture your own as you go.',
    iconClass: 'text-accent-blue',
  },
  {
    icon: BookOpenCheck,
    title: 'Track your progress',
    text: 'Mark steps complete and pick up exactly where you left off.',
    iconClass: 'text-accent-violet',
  },
];

export default function LandingPage() {
  const { navigate } = useRouter();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadGuides = async () => {
      try {
        const data = await fetchUserGuides();

        if (active) {
          setGuides(data);
        }
      } catch (error) {
        console.error('Failed to load guides:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGuides();

    return () => {
      active = false;
    };
  }, []);

  const inProgress = guides.filter(
    (guide) => guide.completedSteps < guide.totalSteps
  );

  const completed = guides.filter(
    (guide) => guide.completedSteps === guide.totalSteps
  );

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-primary-50 via-indigo-50 to-purple-50 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="tag mx-auto mb-6 !bg-primary-50 !text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Your interactive learning assistant
          </span>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-6xl">
            Learn by doing, <span className="text-primary">one step at a time</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">
            Stepwise AI turns any task into a guided, visual walkthrough. Follow along,
            check off each step, and actually finish what you start.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate({ name: 'create' })}
              className="btn-primary w-full sm:w-auto"
            >
              Create new guide
              <ArrowRight className="h-4 w-4" />
            </button>

            {guides.length > 0 && (
              <button
                onClick={() =>
                  navigate({ name: 'guide', guideId: guides[0].id })
                }
                className="btn-secondary w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Continue a guide
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <f.icon className={`mb-4 h-8 w-8 ${f.iconClass}`} />
              <h3 className="mb-1.5 font-bold text-neutral-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* My guides */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">My guides</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Guides you are currently working through
            </p>
          </div>

          <button
            onClick={() => navigate({ name: 'dashboard' })}
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            View dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading your guides...</p>
        ) : inProgress.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="font-semibold text-neutral-900">
              No guides in progress yet
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Create a guide to get started.
            </p>
            <button
              onClick={() => navigate({ name: 'create' })}
              className="btn-primary mt-5"
            >
              Create new guide
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* Recently completed */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-neutral-900">
          Recently completed
        </h2>

        <div className="card divide-y divide-neutral-100">
          {loading ? (
            <p className="p-5 text-sm text-neutral-500">
              Loading completed guides...
            </p>
          ) : completed.length > 0 ? (
            completed.map((guide) => (
              <button
                key={guide.id}
                onClick={() =>
                  navigate({ name: 'guide', guideId: guide.id })
                }
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-900">
                    {guide.title}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {guide.category}
                  </p>
                </div>

                <span className="hidden text-xs font-medium text-neutral-400 sm:block">
                  {guide.totalSteps} steps
                </span>

                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
              </button>
            ))
          ) : (
            <p className="p-5 text-sm text-neutral-500">
              No completed guides yet.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-black px-6 py-14 text-center sm:px-12">
          <Footprints className="mx-auto mb-4 h-10 w-10 text-primary" />

          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            What will you learn to do today?
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
            Describe a task and Stepwise turns it into a guide you can follow step by step.
          </p>

          <button
            onClick={() => navigate({ name: 'create' })}
            className="btn-primary mt-7"
          >
            Create new guide
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
