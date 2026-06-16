"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

/**
 * Global keyboard shortcuts:
 *  "/" → focus search / open add dialog on a category page
 *  "Esc" handled by Radix dialogs natively
 *  "g f" / "g t" / "g g" / "g b" → jump to films/tv/games/books
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const { info } = useToast();

  useEffect(() => {
    let lastG = 0;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "/" && !inField) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder^="Search"]'
        );
        if (input) {
          input.focus();
          input.select();
        } else {
          info("Tip", "Press / on a category page to search");
        }
        return;
      }

      if (e.key === "g" && !inField) {
        lastG = Date.now();
        return;
      }
      if (lastG && Date.now() - lastG < 1000 && !inField) {
        if (e.key === "f") router.push("/films");
        else if (e.key === "t") router.push("/tv");
        else if (e.key === "g") router.push("/games");
        else if (e.key === "b") router.push("/books");
        lastG = 0;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, info]);
}
