/**
 * Where an enquiry came from (public.enquiries.source, migration 021). Shared by the backend (webhook → CRM leads)
 * and the admin Enquiries page (source badge + filter). Rows from before 021 have no source and count as "website".
 */
export const LEAD_SOURCES = {
  website: { label: "Website", short: "Web", color: "#475569", bg: "#f1f5f9" },
  instagram_dm: { label: "Instagram DM", short: "IG DM", color: "#c13584", bg: "#fdf2f8" },
  whatsapp: { label: "WhatsApp", short: "WhatsApp", color: "#128c7e", bg: "#ecfdf5" },
};
export const leadSourceOf = (enquiry) => (LEAD_SOURCES[enquiry?.source] ? enquiry.source : "website");
