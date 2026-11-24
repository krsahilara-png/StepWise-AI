import { Footprints } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <Footprints className="h-4 w-4 text-primary" />
          </span>
          <span className="font-bold">
            Stepwise <span className="text-primary">AI</span>
          </span>
        </div>
        <p className="text-sm text-neutral-400">Learn by doing, one step at a time.</p>
        <p className="text-sm text-neutral-500">© 2026 Stepwise AI</p>
      </div>
    </footer>
  );
}
