"use client";

import { useEffect, useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2, AlertTriangle, Moon, Sun, Monitor } from "lucide-react";
import { itemsRepo } from "@/lib/db/repo";
import { useToast } from "@/components/ui/toast";

type Theme = "dark" | "light" | "system";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const items = useLiveQuery(() => itemsRepo.list(), [], []);
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("relog:theme")) as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("light", sys === "light");
    } else {
      root.classList.toggle("light", theme === "light");
    }
    if (typeof localStorage !== "undefined") localStorage.setItem("relog:theme", theme);
  }, [theme]);

  async function handleExport() {
    try {
      const json = await itemsRepo.exportJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relog-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success("Exported", `${items?.length ?? 0} items`);
    } catch (e) {
      error("Export failed", e instanceof Error ? e.message : "");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid file");
      let added = 0;
      for (const it of data.items) {
        const { id, addedAt, ...rest } = it;
        await itemsRepo.create({ ...rest, status: rest.status ?? "backlog" });
        added++;
      }
      success("Imported", `${added} items`);
    } catch (e) {
      error("Import failed", e instanceof Error ? e.message : "");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleClear() {
    try {
      await itemsRepo.clearAll();
      success("All data cleared");
      setConfirming(false);
    } catch (e) {
      error("Could not clear", e instanceof Error ? e.message : "");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Data is stored locally in your browser. Export to back up.
      </p>

      <Section title="Appearance">
        <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-1">
          {(
            [
              { v: "dark", label: "Dark", icon: Moon },
              { v: "light", label: "Light", icon: Sun },
              { v: "system", label: "System", icon: Monitor },
            ] as const
          ).map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setTheme(v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                theme === v ? "bg-[var(--color-gold-bright)] text-[var(--color-bg)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Data">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-gold-bright)] px-3 py-1.5 text-xs font-semibold text-[var(--color-bg)] transition-transform hover:scale-105 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Export ({items?.length ?? 0})
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
          >
            <Upload className="h-3.5 w-3.5" />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </Section>

      <Section title="Danger zone">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all data
          </button>
        ) : (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
              <div>
                <div className="font-medium text-red-400">Delete everything?</div>
                <div className="text-xs text-[var(--color-muted)]">
                  All {items?.length ?? 0} items will be removed. Export first if you want a backup.
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleClear}
                className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{title}</h2>
      {children}
    </section>
  );
}
