"use client";

import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function GlobalShortcuts() {
  useKeyboardShortcuts();
  useEffect(() => {}, []);
  return null;
}
