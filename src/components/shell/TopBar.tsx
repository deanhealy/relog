"use client";

import { usePathname } from "next/navigation";
import { Library } from "lucide-react";
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
    </header>
  );
}
