/** Helpers for the AI reply modal (kept out of the .jsx so React Fast Refresh stays happy). */
export const phone10 = (p = "") => {
  const d = String(p).replace(/\D/g, "");
  const ten = d.length > 10 ? d.slice(-10) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : "";
};

/** Which channel an enquiry most likely came from. */
export function channelForEnquiry(item = {}) {
  const hay = `${item.source || ""} ${item.category || ""} ${(item.tags || []).join(" ")} ${item.location || ""} ${item.pageKey || ""}`.toLowerCase();
  if (/insta|\big\b|\bdm\b/.test(hay)) return "instagram";
  if (/whats\s?app|\bwa\b/.test(hay)) return "whatsapp";
  if (item.pageUrl || item.pageKey) return "website";
  return "whatsapp";
}
export const isWebsiteEnquiry = (item = {}) => channelForEnquiry(item) === "website";
