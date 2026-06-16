"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "info";
type Toast = { id: string; title: string; description?: string; variant: ToastVariant };

type Ctx = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = String(++idRef.current);
      setToasts((cur) => [...cur, { ...t, id }]);
      const ms = t.variant === "error" ? 6000 : 3500;
      setTimeout(() => remove(id), ms);
    },
    [remove]
  );

  const api = useMemo<Ctx>(
    () => ({
      toast: push,
      success: (title, description) => push({ title, description, variant: "success" }),
      error: (title, description) => push({ title, description, variant: "error" }),
      info: (title, description) => push({ title, description, variant: "info" }),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "error"
      ? AlertCircle
      : Info;
  const tint =
    toast.variant === "success"
      ? "text-emerald-400"
      : toast.variant === "error"
      ? "text-red-400"
      : "text-[var(--color-gold-bright)]";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border border-[var(--color-border)]",
        "bg-[var(--color-surface)]/95 px-3 py-3 shadow-xl backdrop-blur"
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tint)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--color-text)]">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">{toast.description}</div>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastViewport() {
  return null;
}
