function pad(value) {
  return String(value).padStart(2, "0");
}

export function toTimeInputValue(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  const twentyFourHourMatch = input.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${pad(hour)}:${pad(minute)}`;
    }
  }

  const meridiemMatch = input.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!meridiemMatch) return "";

  let hour = Number(meridiemMatch[1]);
  const minute = Number(meridiemMatch[2]);
  const meridiem = meridiemMatch[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return "";
  if (meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  return `${pad(hour)}:${pad(minute)}`;
}

export function formatTimeFromInput(value) {
  const input = String(value || "").trim();
  if (!input) return "";
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return input;

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${pad(hour)}:${minute} ${meridiem}`;
}
