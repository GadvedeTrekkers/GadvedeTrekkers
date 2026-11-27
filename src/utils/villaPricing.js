/* Weekend nights = Friday and Saturday nights (check-in on Fri/Sat). */
function isWeekendNight(date) {
  const d = date.getDay();
  return d === 5 || d === 6;
}

/** Total stay price, using weekendPrice for Fri/Sat nights when the villa has one. */
export function villaStayTotal(villa, checkIn, checkOut) {
  const weekday = Number(villa.price) || 0;
  const weekend = Number(villa.weekendPrice) || 0;
  if (!checkIn || !checkOut) return { nights: 1, weekdayNights: 1, weekendNights: 0, total: weekday };
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  let weekdayNights = 0;
  let weekendNights = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    if (weekend && isWeekendNight(d)) weekendNights += 1;
    else weekdayNights += 1;
  }
  const nights = weekdayNights + weekendNights;
  return { nights, weekdayNights, weekendNights, total: weekdayNights * weekday + weekendNights * (weekend || weekday) };
}
