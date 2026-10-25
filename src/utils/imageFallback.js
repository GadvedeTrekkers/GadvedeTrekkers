/**
 * imageFallback.js
 * Lightweight branded placeholder + onError handler so broken or missing
 * images never show the browser's broken-image icon on cards and tiles.
 */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9efe3"/><stop offset="1" stop-color="#b7dcc8"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<path d="M0 240 L90 150 L150 200 L230 110 L310 190 L360 150 L400 180 L400 300 L0 300 Z" fill="#8cc4a6"/>
<path d="M0 270 L70 220 L140 250 L220 200 L300 245 L400 215 L400 300 L0 300 Z" fill="#198754" opacity="0.55"/>
<circle cx="320" cy="70" r="22" fill="#fff" opacity="0.7"/>
</svg>`;

export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Use as <img onError={handleImageError} /> */
export function handleImageError(event) {
  const img = event?.currentTarget;
  if (!img || img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = "1";
  img.src = FALLBACK_IMAGE;
}

/** Ensure a list of image URLs is non-empty. */
export function withFallbackImages(list = []) {
  const clean = (Array.isArray(list) ? list : []).filter(
    (src) => typeof src === "string" && src.trim()
  );
  return clean.length ? clean : [FALLBACK_IMAGE];
}
