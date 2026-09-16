"use client";

/**
 * Read the design tokens from CSS so charts stay theme-aware.
 *
 * Recharts sets `stroke`/`fill` as SVG presentation attributes, and those do not
 * accept `var(--x)`. Rather than hardcode hex (which would break dark mode) we read
 * the computed values off :root once on mount and again whenever the OS colour
 * scheme changes.
 */
import { useEffect, useState } from "react";

export type Palette = {
  primary: string;
  primarySoft: string;
  control: string;
  secondary: string;
  alert: string;
  border: string;
  muted: string;
  text: string;
  surface: string;
};

const FALLBACK: Palette = {
  primary: "#b4531f",
  primarySoft: "#e8d5c6",
  control: "#7e8a99",
  secondary: "#3f7d6e",
  alert: "#9c2f2f",
  border: "#e5e1da",
  muted: "#6b6760",
  text: "#1b1a18",
  surface: "#ffffff",
};

const VARS: Record<keyof Palette, string> = {
  primary: "--primary",
  primarySoft: "--primary-soft",
  control: "--control",
  secondary: "--secondary",
  alert: "--alert",
  border: "--border",
  muted: "--muted",
  text: "--text",
  surface: "--surface",
};

function read(): Palette {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const out = { ...FALLBACK };
  for (const [key, cssVar] of Object.entries(VARS) as [keyof Palette, string][]) {
    const v = cs.getPropertyValue(cssVar).trim();
    if (v) out[key] = v;
  }
  return out;
}

export function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(FALLBACK);

  useEffect(() => {
    setPalette(read());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPalette(read());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return palette;
}
