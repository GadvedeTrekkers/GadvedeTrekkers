/* Small, dependency-free helpers for the admin 3D look. Safe to import anywhere:
   nothing here pulls in three.js. */
import { useEffect, useState } from "react";

let webglCache;
/** True when the browser can create a WebGL context (checked once, then cached). */
export function hasWebGL() {
  if (webglCache !== undefined) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    webglCache = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

function query(q) {
  return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q) : null;
}

/** Live value of a media query (e.g. prefers-reduced-motion). */
export function useMediaQuery(q) {
  const [match, setMatch] = useState(() => !!query(q)?.matches);
  useEffect(() => {
    const mq = query(q);
    if (!mq) return undefined;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [q]);
  return match;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/**
 * Subtle 3D tilt for every `[data-tilt]` element inside `ref`.
 * Only on mouse/trackpad devices and only when the user has not asked for reduced motion.
 * Writes CSS variables (--tilt-x / --tilt-y / --tilt-glare); the CSS does the rest.
 */
export function useTilt(ref) {
  const reduced = useReducedMotion();
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  useEffect(() => {
    const root = ref.current;
    if (!root || reduced || !finePointer) return undefined;
    let frame = 0;
    let active = null;
    const reset = (el) => {
      if (!el) return;
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
      el.style.removeProperty("--tilt-glare");
      el.classList.remove("is-tilting");
    };
    const onMove = (e) => {
      const el = e.target.closest?.("[data-tilt]");
      if (el !== active) { reset(active); active = el; }
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add("is-tilting");
        el.style.setProperty("--tilt-x", `${(-py * 7).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * 9).toFixed(2)}deg`);
        el.style.setProperty("--tilt-glare", `${((px + 0.5) * 100).toFixed(0)}%`);
      });
    };
    const onLeave = () => { reset(active); active = null; };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      reset(active);
    };
  }, [ref, reduced, finePointer]);
}
