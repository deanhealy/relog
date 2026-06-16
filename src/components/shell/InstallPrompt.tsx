"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "relog:install-dismissed";
const STORAGE_DAYS = 14;

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (dismissed) {
      const ts = Number(dismissed);
      if (Number.isFinite(ts) && Date.now() - ts < STORAGE_DAYS * 24 * 3600 * 1000) {
        return;
      }
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      // Delay so the banner doesn't fire on first paint
      setTimeout(() => setVisible(true), 1500);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    }
    setEvt(null);
  }

  function dismiss() {
    setVisible(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  }

  return (
    <AnimatePresence>
      {visible && evt && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed bottom-20 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-surface)]/95 p-3 shadow-2xl backdrop-blur md:bottom-6"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-gold)]/15 text-[var(--color-gold-bright)]">
              <Download className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--color-text)]">
                Install Relog
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                Add to your home screen for one-tap access, offline mode, and a native feel.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={install}
                  className="rounded-full bg-[var(--color-gold-bright)] px-3 py-1 text-[11px] font-semibold text-[var(--color-bg)] transition-transform hover:scale-105 active:scale-95"
                >
                  Install
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-full px-2 py-1 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
