import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Offline · Relog" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl">🃏</p>
      <h1 className="mt-4 font-serif text-2xl tracking-tight">You’re offline</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Relog works offline once it’s been opened. Your data is still here — cached locally in your browser.
      </p>
      <Link
        href="/films"
        className="mt-6 inline-flex items-center gap-1 rounded-full bg-[var(--color-gold-bright)] px-4 py-2 text-xs font-semibold text-[var(--color-bg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Try again
      </Link>
    </div>
  );
}
