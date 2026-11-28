import { realRating } from "../utils/rating";

/** Compact "★ 4.8 (32)" badge for trip cards. Renders nothing unless the trip has a real rating. */
export default function TripRating({ item }) {
  const rating = realRating(item);
  if (!rating) return null;
  return (
    <div className="trek-rating" aria-label={`Rated ${rating.label}`}>
      <span className="trek-rating-star" aria-hidden="true">★</span>
      <span>{rating.value.toFixed(1)}</span>
      <span className="trek-rating-count">({rating.count.toLocaleString("en-IN")})</span>
    </div>
  );
}
