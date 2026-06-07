// ─── Typography ─────────────────────────────────────────────────────
// Inter is self-hosted in /public/fonts and loaded from the bundle, so it
// works with zero network access (local, Lambda, and GPU worker alike).

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const FAMILY = "Inter";

([
  ["400", "inter-latin-400-normal.woff2"],
  ["500", "inter-latin-500-normal.woff2"],
  ["600", "inter-latin-600-normal.woff2"],
  ["700", "inter-latin-700-normal.woff2"],
  ["800", "inter-latin-800-normal.woff2"],
  ["900", "inter-latin-900-normal.woff2"],
] as const).forEach(([weight, file]) => {
  loadFont({
    family: FAMILY,
    url: staticFile(`fonts/${file}`),
    weight,
    style: "normal",
  }).catch(() => {
    // Never let a font hiccup break a render — fall back to system sans.
  });
});

export const FONT = `${FAMILY}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
