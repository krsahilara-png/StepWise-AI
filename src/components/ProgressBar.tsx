interface Props {
  percent: number;
  className?: string;
}

export default function ProgressBar({ percent, className = '' }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-600 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
