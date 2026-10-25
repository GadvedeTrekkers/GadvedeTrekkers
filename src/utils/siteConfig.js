/**
 * siteConfig.js
 * Central site configuration for Gadvede Trekkers.
 * All SEO, canonical URLs, and social references use this as the single source of truth.
 */

export const SITE = {
  domain:      "https://www.gadvede.com",
  name:        "Gadvede Trekkers",
  tagline:     "Treks, Tours & Adventures in Maharashtra",
  description: "Book the best treks, tours, and adventures in Maharashtra. Weekend treks, monsoon treks, fort treks, camping, heritage walks and corporate outings near Pune & Mumbai. Expert guides, safe batches. Starting ₹799.",
  logo:        "https://www.gadvede.com/gadvedelogo.png",
  phone:       "+91-9856112727",
  whatsapp:    "919856112727",     // no + or spaces
  email:       "info@gadvede.com",
  address:     "Pune, Maharashtra, India",

  social: {
    instagram: "https://www.instagram.com/gadvede_trekkers/",
    facebook:  "https://www.facebook.com/gadvedetrekkers",
    youtube:   "https://www.youtube.com/@gadvedetrekkers",
    twitter:   "@GadvedeTrekkers",
  },

  /** Generates a canonical URL for any path */
  url: (path = "/") => `https://www.gadvede.com${path}`,

  /** Generates a WhatsApp enquiry link */
  whatsappLink: (message = "") =>
    `https://wa.me/919856112727${message ? `?text=${encodeURIComponent(message)}` : ""}`,
};

export default SITE;
