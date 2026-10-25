/**
 * contact.js
 * Single source of truth for public contact details shown in the
 * Header, Footer and Contact page.
 */
export const CONTACT = {
  phones: ["9856112727", "9856122727"],
  whatsapp: "919856112727",
  email: "info@gadvede.com",
  supportEmail: "support@gadvede.com",
  addressLines: ["Gadvede Trekkers", "Pune, Maharashtra", "India"],
  social: {
    instagram: "https://www.instagram.com/gadvedetrekkers",
    youtube: "https://www.youtube.com/@gadvedetrekkers",
    facebook: "https://www.facebook.com/gadvedetrekkers",
  },
};

export const telHref = (phone) => `tel:+91${String(phone).replace(/\D/g, "").slice(-10)}`;

export const whatsappHref = (message = "") =>
  `https://wa.me/${CONTACT.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export default CONTACT;
