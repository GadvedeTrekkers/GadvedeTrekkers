import { getWhatsappNumber, waUrl } from "./whatsappSetting.js";
import { getSiteProfile } from "./siteContent.js";
/**
 * contact.js — public contact details, read from the admin (t129u):
 *   - WhatsApp / phone: Admin → Profile Setup (single number; default +91 98561 12727 lives in whatsappSetting.js)
 *   - email, social links, city: Admin → Profile Setup (public fields only)
 * Nothing else is hard-coded here: an empty value is simply not shown.
 */
const profile = () => getSiteProfile() || {};

export const CONTACT = {
  /** The public phone is the single WhatsApp line. */
  get phones() { return [getWhatsappNumber().slice(-10)]; },
  get whatsapp() { return getWhatsappNumber(); },
  get email() { return profile().supportEmail || ""; },
  get supportEmail() { return profile().supportEmail || ""; },
  get companyName() { return profile().companyName || ""; },
  get addressLines() {
    const a = profile().address || {};
    return [profile().companyName, [a.city, a.state].filter(Boolean).join(", "), a.country].filter((x) => String(x || "").trim());
  },
  get social() {
    const s = profile().socials || {};
    return { instagram: s.instagram || "", youtube: s.youtube || "", facebook: s.facebook || "" };
  },
};

export const telHref = (phone) => `tel:+91${String(phone).replace(/\D/g, "").slice(-10)}`;

export const whatsappHref = (message = "") => waUrl(message);

export default CONTACT;
