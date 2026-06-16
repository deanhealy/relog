"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { itemsRepo } from "@/lib/db/repo";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar, DesktopTopBar } from "@/components/shell/TopBar";
import { MobileNav } from "@/components/shell/MobileNav";
import { Attribution } from "@/components/shell/Attribution";
import { GlobalShortcuts } from "@/components/shell/GlobalShortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const counts = useLiveQuery(() => itemsRepo.countByType(), [], undefined);

  return (
    <div className="flex min-h-dvh">
      <Sidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DesktopTopBar />
        <main className="flex-1 px-4 py-6 pb-20 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
        <footer className="border-t border-[var(--color-border)] px-4 py-4 text-center text-[10px] text-[var(--color-muted)] md:px-8">
          <Attribution />
        </footer>
      </div>
      <MobileNav />
      <GlobalShortcuts />
    </div>
  );
}
