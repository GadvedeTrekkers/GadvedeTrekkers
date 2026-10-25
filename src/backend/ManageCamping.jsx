import ManagePage from "./ManagePage";
import { CATALOG_HUBS, hubBySlug } from "../data/catalogHubs";
import {
  CAMPING_CARRY_OPTIONS,
  CAMPING_EXCLUDED_OPTIONS,
  CAMPING_INCLUDED_OPTIONS,
  CAMPING_SEED_DATA,
  getPrimaryCampingImage,
  parseJsonValue,
} from "../data/campingDetailsData";

const CAMPING_PREVIEW_KEY = "gt_camping_preview";

const FIELDS = [
  { key: "sortOrder", label: "Sort Order", type: "number", placeholder: "1" },
  { key: "name", label: "Camp Name (Full)", required: true, col: 8 },
  { key: "shortName", label: "Short Name", required: true, col: 4, placeholder: "Alibaug Camping" },
  { key: "type", label: "Type", required: true, type: "select", options: ["Beach", "Lake", "Forest", "Mountain", "Hill", "Farm"] },
  { key: "location", label: "Location", required: true, placeholder: "Alibaug, Maharashtra" },
  { key: "hubSlug", label: "Catalog hub", type: "select", options: CATALOG_HUBS.map((hub) => ({ value: hub.slug, label: hub.name })), col: 4 },
  { key: "destination", label: "Destination", placeholder: "Tamhini Ghat, Maharashtra", col: 4 },
  { key: "category", label: "Category label", placeholder: "Camping", col: 4 },
  { key: "duration", label: "Duration", required: true, placeholder: "Overnight" },
  { key: "price", label: "Price (₹)", required: true, type: "number", placeholder: "1099" },
  { key: "originalPrice", label: "Original Price (₹)", type: "number", placeholder: "1499" },
  { key: "badge", label: "Badge", placeholder: "Most Popular" },
  { key: "availability", label: "Availability", placeholder: "Available / On Request" },
  { key: "coupon", label: "Coupon / Offers Label", placeholder: "3 offers" },
  { key: "description", label: "Listing Description", type: "textarea", col: 12, placeholder: "Short card description shown on the camping listing page." },
  { key: "imageGallery", label: "Camp Image Gallery", type: "imageGallery", col: 12 },
  { key: "trekDateBatches", label: "Camp batches", type: "trekDates", col: 12 },
  { key: "nextDates", label: "Upcoming Dates", type: "textarea", col: 12, placeholder: "One date per line\nExample:\n27 Mar, 4:00 PM\n03 Apr, 4:00 PM" },
  { key: "overview", label: "Overview", type: "textarea", col: 12, placeholder: "Main overview visible on the details page." },
  { key: "howToReach", label: "How To Reach", type: "textarea", col: 12, placeholder: "Add travel instructions line by line." },
  {
    key: "eventDetails",
    label: "Camp Detail Highlights",
    type: "textarea",
    col: 12,
    placeholder: "Format: Title|Detail\nExample:\nCamping Location|Alibaug near Nagaon Beach\nFood|Dinner and breakfast included",
  },
  {
    key: "itinerary",
    label: "Detailed Itinerary",
    type: "textarea",
    col: 12,
    placeholder: "Format: Day|Time|Description\nExample:\nDay 1|04:00 PM|Reach campsite and check in",
  },
  {
    key: "highlights",
    label: "Highlights",
    type: "textarea",
    col: 12,
    placeholder: "Format: Title|Description\nExample:\nBeachside Bonfire|Relax by the fire with the sound of waves",
  },
  {
    key: "included",
    label: "What's Included",
    type: "checklistTextarea",
    col: 12,
    options: CAMPING_INCLUDED_OPTIONS,
    placeholder: "Add one inclusion per line",
  },
  {
    key: "notIncluded",
    label: "What's Not Included",
    type: "checklistTextarea",
    col: 12,
    options: CAMPING_EXCLUDED_OPTIONS,
    placeholder: "Add one exclusion per line",
  },
  {
    key: "thingsToCarry",
    label: "Things To Carry",
    type: "checklistTextarea",
    col: 12,
    options: CAMPING_CARRY_OPTIONS,
    placeholder: "Add one item per line",
  },
  {
    key: "offers",
    label: "Offers / Coupons",
    type: "textarea",
    col: 12,
    placeholder: "Format: CODE|Description\nExample:\nEARLY75|Early Booking Discount",
  },
  {
    key: "faqs",
    label: "FAQs",
    type: "textarea",
    col: 12,
    placeholder: "Format: Question|Answer",
  },
  { key: "cancellationPolicy", label: "Cancellation Policy", type: "textarea", col: 12, placeholder: "Add one policy line per row." },
  { key: "rules", label: "Rules & Regulations", type: "textarea", col: 12, placeholder: "Add one rule per line." },
];

const DEFAULT = {
  sortOrder: "",
  slug: "",
  name: "",
  shortName: "",
  type: "Lake",
  location: "",
  hubSlug: "camping",
  destination: "",
  category: "Camping",
  trekDateBatches: "[]",
  duration: "Overnight",
  price: "",
  originalPrice: "",
  badge: "",
  availability: "Available",
  coupon: "",
  description: "",
  image: "",
  imageGallery: "[]",
  nextDates: "",
  overview: "",
  howToReach: "",
  eventDetails: "",
  itinerary: "",
  highlights: "",
  included: "",
  notIncluded: "",
  thingsToCarry: "",
  offers: "",
  faqs: "",
  cancellationPolicy: "",
  rules: "",
  active: true,
};

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prepareCampingForm(form) {
  const gallery = parseJsonValue(form.imageGallery, []).filter(Boolean);
  const nextDates = String(form.nextDates || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const hubSlug = form.hubSlug || "camping";
  const hub = hubBySlug(hubSlug);
  return {
    ...form,
    hubSlug,
    destination: form.destination || form.location || "",
    category: form.category || hub?.name || "Camping",
    slug: form.slug || slugify(form.shortName || form.name),
    sortOrder: form.sortOrder === "" ? "" : Number(form.sortOrder) || 0,
    price: Number(form.price) || 0,
    originalPrice: Number(form.originalPrice) || 0,
    imageGallery: JSON.stringify(gallery),
    image: gallery[0] || form.image || "",
    nextDates: JSON.stringify(nextDates.length ? nextDates : ["Available on Request"]),
  };
}

export default function ManageCamping() {
  return (
    <ManagePage
      title="Camping"
      icon="⛺"
      storageKey="gt_camping"
      fields={FIELDS}
      defaultForm={DEFAULT}
      seedData={CAMPING_SEED_DATA}
      transformForm={prepareCampingForm}
      onPreview={(currentForm) => {
        const previewCamp = {
          ...prepareCampingForm(currentForm),
          id: "preview",
          shortName: currentForm.shortName || currentForm.name || "Preview Campsite",
          name: currentForm.name || currentForm.shortName || "Preview Campsite",
          image: getPrimaryCampingImage(currentForm),
        };

        sessionStorage.setItem(CAMPING_PREVIEW_KEY, JSON.stringify(previewCamp));
        window.open("/camping/preview", "_blank", "noopener,noreferrer");
      }}
    />
  );
}
