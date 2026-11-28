/* Resolve a /rentals/:id URL to a published rental or villa.
   The list page (/rentals) shows both rentals and villas, and the address can be the record id or its slug
   (a shared link has neither router state nor a warm cache), so the lookup accepts either. */

export function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function rentalSlug(item = {}) {
  return item.slug || slugify(item.shortName || item.name);
}

/** Path used by every link to a rental/villa detail page: the slug when there is one, else the id. */
export function rentalPath(item = {}) {
  return `/rentals/${rentalSlug(item) || item.id}`;
}

/** @returns the published item (rentals first, then villas flagged category "Villas") or null. */
export function findRentalEntry(idOrSlug, { rentals = [], villas = [] } = {}) {
  if (!idOrSlug) return null;
  const wanted = String(idOrSlug);
  const hit = (item) => item && item.active !== false && (String(item.id) === wanted || rentalSlug(item) === wanted);
  const rental = rentals.find(hit);
  if (rental) return rental;
  const villa = villas.find(hit);
  return villa ? { ...villa, category: "Villas" } : null;
}
