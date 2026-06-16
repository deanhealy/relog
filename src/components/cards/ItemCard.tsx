"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Star, GripVertical } from "lucide-react";
import Link from "next/link";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

function useObjectUrl(blob?: Blob): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    const id = setTimeout(() => setUrl(u), 0);
    return () => {
      clearTimeout(id);
      URL.revokeObjectURL(u);
    };
  }, [blob]);
  return url;
}

function CoverImage({ item }: { item: Item }) {
  const blobUrl = useObjectUrl(item.coverBlob);
  const src = blobUrl ?? item.coverUrl;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={item.title}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
        src ? "" : "opacity-30"
      )}
      loading="lazy"
    />
  );
}

function GlareLayer({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const gx = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const gy = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);
  const bg = useTransform(
    [gx, gy],
    ([x, y]) =>
      `radial-gradient(500px circle at ${x} ${y}, rgba(245,197,24,0.12), transparent 50%)`
  );
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      style={{ background: bg }}
    />
  );
}

interface ItemCardProps {
  item: Item;
  dragHandle?: ReactNode;
  disableTilt?: boolean;
}

export function ItemCard({ item, dragHandle, disableTilt }: ItemCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 220, damping: 18 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 220, damping: 18 });

  function handleMove(e: React.MouseEvent) {
    if (disableTilt) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  const href = `/${mediaHref(item.mediaType)}/${item.id}`;
  const showRating = item.rating && item.rating > 0;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX: disableTilt ? 0 : rotX,
        rotateY: disableTilt ? 0 : rotY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="group relative"
    >
      <Link
        href={href}
        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
      >
        <div className="pokemon-shine relative aspect-[3/5] w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg shadow-black/40">
          <CoverImage item={item} />
          {!disableTilt && <GlareLayer mx={mx} my={my} />}

          {item.status === "completed" && (
            <div className="absolute left-2 top-2 rounded-full bg-[var(--color-gold)]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bg)] backdrop-blur">
              Done
            </div>
          )}

          {showRating && (
            <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-1 backdrop-blur">
              <Star className="h-3 w-3 fill-[var(--color-gold-bright)] text-[var(--color-gold-bright)]" />
              <span className="text-[10px] font-semibold text-[var(--color-gold-bright)] tabular-nums">
                {item.rating}
              </span>
            </div>
          )}

          {dragHandle && (
            <div className="absolute bottom-12 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              {dragHandle}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-2.5 pb-2.5 pt-6">
            <div className="line-clamp-2 text-xs font-semibold leading-tight text-white">
              {item.title}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/60">
              {item.year && <span>{item.year}</span>}
              {item.rating && item.rating > 0 && (
                <>
                  {item.year && <span className="opacity-40">·</span>}
                  <Star className="h-2.5 w-2.5 fill-[var(--color-gold-bright)] text-[var(--color-gold-bright)]" />
                  <span>{item.rating}/5</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CardDragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      {...props}
      className={cn(
        "grid h-7 w-7 cursor-grab place-items-center rounded-full bg-black/60 text-white/70 backdrop-blur transition-colors hover:bg-black/80 hover:text-white active:cursor-grabbing",
        props.className
      )}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
}

function mediaHref(t: Item["mediaType"]) {
  if (t === "tv") return "tv";
  if (t === "game") return "games";
  return t === "film" ? "films" : "books";
}
