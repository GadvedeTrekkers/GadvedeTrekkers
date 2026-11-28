/**
 * Pure parsers for admin listing fields (one item per line, "a|b|c" rows, JSON strings).
 * Kept apart from the old seed-data modules so public pages never pull hard-coded listings into the bundle (t129u).
 */
export function parseJsonValue(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function parseLineItems(value = "") {
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parsePipeItems(value = "") {
  return parseLineItems(value).map((line) => {
    const [title, detail] = line.split("|");
    return {
      title: String(title || "").trim(),
      detail: String(detail || "").trim(),
    };
  });
}

export function parseFaqItems(value = "") {
  return parseLineItems(value)
    .map((line) => {
      const [q, a] = line.split("|");
      return { q: String(q || "").trim(), a: String(a || "").trim() };
    })
    .filter((item) => item.q && item.a);
}

export function parseOfferItems(value = "") {
  return parseLineItems(value)
    .map((line) => {
      const [code, desc] = line.split("|");
      return { code: String(code || "").trim(), desc: String(desc || "").trim() };
    })
    .filter((item) => item.code);
}

export function parseItineraryItems(value = "") {
  return parseLineItems(value)
    .map((line) => {
      const [day, time, description] = line.split("|");
      return {
        day: String(day || "").trim(),
        time: String(time || "").trim(),
        description: String(description || "").trim(),
      };
    })
    .filter((item) => item.day || item.time || item.description);
}

export function getPrimaryCampingImage(item = {}) {
  const gallery = parseJsonValue(item.imageGallery, []);
  return item.image || gallery[0] || "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1200&q=80";
}

export function parsePipeRows(value = "") {
  return parseLineItems(value).map((line) => line.split("|").map((part) => part.trim()));
}

function looksLikeClockTime(value) {
  return /^\d{1,2}(:\d{2})?\s*(am|pm)?$/i.test(String(value || "").trim());
}

/** Day N|title|item, with later rows as Day N||item. Clock times stay on the bullet. */
export function parseIvItinerary(value) {
  if (Array.isArray(value)) {
    return value
      .map((day) => ({
        day: String(day?.day || "Day").trim() || "Day",
        title: String(day?.title || day?.day || "Day").trim() || "Day",
        items: (Array.isArray(day?.items) ? day.items : [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      }))
      .filter((day) => day.title || day.items.length);
  }

  const days = [];
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split("|");
      const day = (parts[0] || "").trim() || "Day";
      const second = (parts[1] || "").trim();
      const detail = parts.slice(2).join("|").trim();
      let entry = days.find((item) => item.day === day);
      if (!entry) {
        entry = { day, title: "", items: [] };
        days.push(entry);
      }

      if (parts.length < 3) {
        if (!second) return;
        if (!entry.title) entry.title = second;
        else entry.items.push(second);
        return;
      }

      if (!second) {
        if (detail) entry.items.push(detail);
        return;
      }

      if (looksLikeClockTime(second)) {
        entry.items.push(detail ? `${second} — ${detail}` : second);
        return;
      }

      if (!entry.title) entry.title = second;
      if (detail) entry.items.push(detail);
      else if (entry.title !== second) entry.items.push(second);
    });

  return days.map((day) => ({
    day: day.day,
    title: day.title || day.day,
    items: day.items,
  }));
}

export function itineraryToPipe(days = []) {
  return (Array.isArray(days) ? days : [])
    .flatMap((day) => {
      const label = day.day || "Day";
      const title = day.title && day.title !== label ? day.title : "";
      return (day.items || []).map((item, index) =>
        index === 0 ? `${label}|${title}|${item}` : `${label}||${item}`
      );
    })
    .join("\n");
}
