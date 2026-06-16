"use client";

import { usePathname } from "next/navigation";
import { Library, Search } from "lucide-react";
import Link from "next/link";

const TITLES: Record<string, string> = {
  "/films": "Films",
  "/tv": "TV",
  "/games": "Games",
  "/books": "Books",
  "/settings": "Settings",
  "/about/attribution": "Attribution",
};

function getTitle(pathname: string | null) {
  if (!pathname) return "Relog";
  for (const key of Object.keys(TITLES)) {
    if (pathname.startsWith(key)) return TITLES[key];
  }
  return "Relog";
}

export function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 backdrop-blur md:hidden">
      <Link href="/films" className="flex items-center gap-2">
        <Library className="h-5 w-5 text-[var(--color-gold-bright)]" />
        <span className="font-serif text-lg tracking-tight">{title}</span>
      </Link>
    </header>
  );
}

export function DesktopTopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-6 backdrop-blur md:flex">
      <h1 className="font-serif text-xl tracking-tight">{title}</h1>
      <button
        onClick={() => {
          const evt = new CustomEvent("relog:open-palette");
          window.dispatchEvent(evt);
        }}
        className="ml-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-text)]"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 py-0.5 text-[9px]">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
