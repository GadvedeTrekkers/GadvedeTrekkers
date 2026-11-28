/**
 * A rating is shown only when the record has BOTH a numeric rating (0–max) and a whole-number
 * review count above zero. Placeholder text such as "100+" or "1000+" never counts.
 * Returns null when there is nothing real to show.
 */
export function realRating(item, { max = 5 } = {}) {
  const value = Number(item?.rating);
  const count = Number(item?.reviews ?? item?.reviewCount);
  if (!(value > 0 && value <= max) || !Number.isInteger(count) || count <= 0) return null;
  return {
    value,
    count,
    label: `${value.toFixed(1)} (${count.toLocaleString("en-IN")} review${count === 1 ? "" : "s"})`,
  };
}
