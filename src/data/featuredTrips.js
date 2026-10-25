import { selectPublicTrips } from "./publicTrips";

/** The only four trips the public home and trek lists are allowed to show. */
export const FEATURED_TRIPS = [
  {
    slug: "vasota-fort-trek",
    name: "Vasota Fort Trek",
    location: "Koyna, Satara",
    destination: "Bamnoli",
    difficulty: "Medium",
    duration: "2 Days",
    price: 1800,
    image: "/trips/vasota.jpg",
    productType: "trek",
    active: true,
  },
  {
    slug: "harishchandragad-trek",
    name: "Harishchandragad Trek",
    location: "Pachnai, Ahmednagar",
    destination: "Harishchandragad",
    difficulty: "Medium",
    duration: "2 Days",
    price: 1400,
    image: "/trips/harishchandragad.jpg",
    productType: "trek",
    active: true,
  },
  {
    slug: "kalsubai-peak-trek",
    name: "Kalsubai Peak Trek",
    location: "Bari, Ahmednagar",
    destination: "Kalsubai",
    difficulty: "Medium",
    duration: "1 Night",
    price: 1400,
    image: "/trips/kalsubai.jpg",
    productType: "trek",
    active: true,
  },
  {
    slug: "new-year-beach-side-camping",
    name: "New Year Beach Side Camping",
    location: "Konkan coast",
    destination: "Beach camp",
    difficulty: "Easy",
    duration: "30 Dec night – 1 Jan",
    price: 2800,
    image: "/trips/nye-beach.jpg",
    productType: "camping",
    active: true,
  },
];

export function mergeFeaturedTrips(apiItems = []) {
  const live = new Map(selectPublicTrips(apiItems).map((item) => [item.slug, item]));
  return FEATURED_TRIPS.map((base) => {
    const remote = live.get(base.slug) || {};
    return {
      ...base,
      ...remote,
      slug: base.slug,
      name: remote.name || base.name,
      image: remote.image || base.image,
      price: remote.price ?? base.price,
      location: remote.location || base.location,
      destination: remote.destination || base.destination,
      duration: remote.duration || base.duration,
      difficulty: remote.difficulty || base.difficulty,
      productType: remote.productType || base.productType,
      active: true,
    };
  });
}
