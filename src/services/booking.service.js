/**
 * booking.service.js
 *
 * Single entry point for ALL booking actions across the site.
 *
 * Routing logic lives here — not in components, not in config.
 * When BOOKING_MODE changes, this file routes to the right channel.
 * Components call bookingService.book(product, options) and know nothing else.
 *
 * Current channel: WHATSAPP
 * Public booking always opens WhatsApp. In-site booking and payment
 * checkout are not the customer path.
 */

import {
  BOOKING_MODE,
  BOOKING_WHATSAPP_NUMBER,
} from "../config/bookingConfig";
import { handleWhatsAppLead } from "../utils/leadActions";

export const bookingService = {
  /**
   * Book a product via the channel configured in bookingConfig.js.
   *
   * @param {object} product   — must have at least: name, location, price
   * @param {object} options   — optional overrides: source, selectedDate,
   *                             customerName, customerPhone, customerEmail, pax
   * @returns {Promise}
   *
   * Usage:
   *   await bookingService.book(heritageItem, { source: "Heritage Listing" });
   */
  async book(product, options = {}) {
    switch (BOOKING_MODE) {
      case "WHATSAPP":
        return this._viaWhatsApp(product, options);

      case "DIRECT_BOOKING":
      case "PAYMENT_GATEWAY":
        console.warn(`bookingService: ${BOOKING_MODE} is not the public booking path. Opening WhatsApp.`);
        return this._viaWhatsApp(product, options);

      default:
        console.warn(`bookingService: unknown BOOKING_MODE "${BOOKING_MODE}", falling back to WhatsApp`);
        return this._viaWhatsApp(product, options);
    }
  },

  /* ── Private channel implementations ──────────────────────────────────── */

  async _viaWhatsApp(product, options) {
    return handleWhatsAppLead({
      phoneNumber: options.phoneNumber ?? BOOKING_WHATSAPP_NUMBER,
      packageName: product.name,
      location:    product.location,
      category:    product.category || product.type || "Package",
      source:      options.source   || "Listing Page",
      selectedDate: options.selectedDate ?? product.nextDate ?? null,
      customerName:  options.customerName,
      customerPhone: options.customerPhone,
      customerEmail: options.customerEmail,
      pax:           options.pax,
      preferredDate: options.preferredDate || options.selectedDate || product.nextDate || "",
    });
  },

};

