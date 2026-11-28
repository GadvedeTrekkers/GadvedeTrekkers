import { selectPublicTrips } from "./publicTrips";

/**
 * t129u: there is no hard-coded trip list any more. The public lists show exactly the products Admin has
 * switched ON in the catalogue (Admin → Treks / Camping / Tours), in the admin's sort order.
 * (The previous built-in list of four trips is kept for reference in
 *  /workspace/gadvede-notes/site-fixes/hardcoded-content-export/featuredTrips.json — not shipped.)
 */
export function mergeFeaturedTrips(apiItems = []) {
  return selectPublicTrips(apiItems);
}
