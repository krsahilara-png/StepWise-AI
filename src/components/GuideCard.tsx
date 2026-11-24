import { Sparkles, Tag as TagIcon } from 'lucide-react';
import type { Guide } from '../lib/types';
import { useRouter } from '../lib/router';

interface Props {
  guide: Guide;
}

export default function GuideCard({ guide }: Props) {
  const { navigate } = useRouter();
  const percent = Math.round((guide.completedSteps / guide.totalSteps) * 100);

  return (
    <button
      onClick={() => navigate({ name: 'guide', guideId: guide.id })}
      className="card card-hover flex w-full flex-col p-5 text-left"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="tag">
          <TagIcon className="h-3 w-3" />
          {guide.category}
        </span>
        <span className="text-xs font-medium text-neutral-400">{guide.updatedAt}</span>
      </div>

      <h3 className="mb-1 text-base font-bold text-neutral-900">{guide.title}</h3>
      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-neutral-500">
        {guide.description}
      </p>

      <div className="mt-auto">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-neutral-500">
            Step {guide.completedSteps} of {guide.totalSteps}
          </span>
          <span className={percent === 100 ? 'text-emerald-600' : 'text-primary'}>
            {percent === 100 ? 'Completed' : `${percent}%`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all ${
              percent === 100 ? 'bg-emerald-500' : 'bg-primary'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent < 100 && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Continue learning
          </span>
        )}
      </div>
    </button>
  );
}
