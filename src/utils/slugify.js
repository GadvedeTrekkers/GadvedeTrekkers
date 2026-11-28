/** "Harihar Fort Trek" → "harihar-fort-trek". Null-safe. Kept apart from data/treks.js so public pages do not bundle old trek data (t129u). */
export function slugifyTrekName(name) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
