import ManagePage from "./ManagePage";
import { itineraryToPipe, ivDestinations } from "../data/industrialVisitsData";

const INDUSTRY_OPTIONS = [
  "Heritage & Cultural Tourism", "Adventure & Eco-Tourism", "Hospitality",
  "Architecture & History", "Textile & Handicraft", "Gem & Jewellery",
  "Marble & Stone Industry", "Desert Ecology & Environment", "Cultural Studies",
  "Tea & Spice Plantations", "Port & Logistics", "Fisheries & Marine",
  "Eco-Tourism & Sustainability", "Tourism & Hospitality", "Event Management",
  "Food & Beverage Industry", "IT & Software", "Manufacturing",
  "Agriculture & Farming", "Pharmaceutical", "Automotive",
];

const FIELDS = [
  { key: "sortOrder", label: "Display Order",   type: "number", col: 3, placeholder: "1 = first" },
  { key: "icon",      label: "Icon (Emoji)",    col: 2, placeholder: "🏔️" },
  { key: "title",     label: "Destination Title", required: true, col: 7, placeholder: "Delhi – Manali – Amritsar – Agra" },
  { key: "subtitle",  label: "Subtitle / Tag",  col: 8, placeholder: "9-Day College Tour — Culture, Spirituality & Adventure" },
  { key: "duration",  label: "Duration",        col: 4, placeholder: "9 Days" },
  { key: "bestFor",   label: "Best For (colleges/stream)", col: 8, placeholder: "Engineering, Management & Arts Colleges" },
  { key: "imageGallery", label: "Destination Images", type: "imageGallery", col: 12 },
  {
    key: "highlights", label: "Trip Highlights (one per line)", type: "textarea", col: 12,
    placeholder: "Delhi's heritage landmarks — Qutub Minar, Lotus Temple, India Gate\nAmritsar's Golden Temple & Wagah Border ceremony",
    aiPrompt: (form) => `Write 5–7 trip highlight bullet points for an industrial visit / college tour to: "${form.title || "[Destination]"}" (${form.duration || "[Duration]"}).

Best for: ${form.bestFor || "college students"}

Format: one highlight per line (no bullets or numbering), each 10–15 words.
Focus on: industry exposure, famous landmarks, unique experiences, learning outcomes.

Output only the lines, nothing else.`,
  },
  {
    key: "industries", label: "Industry Sectors Covered (one per line)", type: "textarea", col: 6,
    placeholder: "Heritage & Cultural Tourism\nAdventure & Eco-Tourism\nHospitality",
    aiPrompt: (form) => `List 4–6 industry sectors that students would be exposed to on a college tour to: "${form.title || "[Destination]"}".

Best for: ${form.bestFor || "college students"}

Format: one sector per line, 3–5 words each.
Example: Heritage & Cultural Tourism

Output only the sector names, nothing else.`,
  },
  {
    key: "pricingSlabs", label: "Pricing Slabs (GroupRange|Price|Note, one per line)", type: "textarea", col: 6,
    placeholder: "20 – 29|14500|Smaller groups\n30 – 39|13500|Standard group\n40 – 49|13000|Better saving\n50+||Custom pricing — contact us",
    helpText: "FORMAT: GroupRange|PricePerHead|Note\nLeave price blank for 'Contact us' pricing.\nExample:\n20 – 29|14500|Smaller groups\n30 – 39|13500|Standard group\n50+||Custom pricing — contact us",
  },
  {
    key: "includes", label: "What's Included (one per line)", type: "textarea", col: 6,
    placeholder: "Round-trip train travel (Pune → Delhi → Pune)\nBus travel between cities\nHotel stays\nDaily breakfast & dinner",
    aiPrompt: (form) => `List 5–7 items included in a college tour package to: "${form.title || "[Destination]"}" (${form.duration || "[Duration]"}).

Format: one item per line.
Cover: transport, accommodation, meals, guide, activities, certificates.

Output only the list items, no bullets or numbering.`,
  },
  {
    key: "excludes", label: "What's NOT Included (one per line)", type: "textarea", col: 6,
    placeholder: "Meals during travel\nAdventure activities (paid)\nEntry fees at monuments\nPersonal expenses",
  },
  {
    key: "itinerary", label: "Day-wise Itinerary (Day|Title|Activity, one per line)", type: "textarea", col: 12,
    placeholder: "Day 1|Pune → Delhi by train|Depart Pune by pre-booked train\nDay 1||Overnight journey towards Delhi",
    helpText: "FORMAT: Day N|Day title|Activity on the first line of each day. More activities for that day: Day N||Activity",
    aiPrompt: (form) => `Write a day-by-day itinerary for a college tour to: "${form.title || "[Destination]"}" — ${form.duration || "[Duration]"}.

FORMAT (one activity per line):
Day N|Day title|First activity
Day N||Next activity

Example:
Day 1|Pune → Delhi by train|Depart Pune by pre-booked train
Day 1||Overnight journey towards Delhi
Day 1||Meals: none (train journey)

Write a complete realistic itinerary covering: ${form.title || "[Destination]"}. Include transport, meals, sightseeing, and overnight stays. Output only the lines in the exact format — no headings, no extra text.`,
  },
];

const DEFAULT = {
  sortOrder: "", icon: "🏛️", title: "", subtitle: "", duration: "",
  bestFor: "", imageGallery: "[]", highlights: "", industries: "",
  pricingSlabs: "", includes: "", excludes: "", itinerary: "", active: true,
};

const SEED = ivDestinations.map((d, index) => ({
  ...DEFAULT,
  sortOrder: index + 1,
  id: d.id,
  icon: d.icon || "",
  title: d.title || "",
  subtitle: d.subtitle || "",
  duration: d.duration || "",
  bestFor: d.bestFor || "",
  imageGallery: JSON.stringify((d.images || []).map((img) => img.src).filter(Boolean)),
  highlights: (d.highlights || []).join("\n"),
  industries: (d.industries || []).join("\n"),
  pricingSlabs: (d.pricingSlabs || [])
    .map((s) => `${s.students}|${s.pricePerHead != null ? s.pricePerHead : ""}|${s.note || ""}`)
    .join("\n"),
  includes: (d.includes || []).join("\n"),
  excludes: (d.excludes || []).join("\n"),
  itinerary: itineraryToPipe(d.itinerary || []),
  active: true,
}));

export default function ManageIV() {
  return (
    <ManagePage
      title="Industrial Visits"
      icon="🎓"
      storageKey="gt_iv"
      fields={FIELDS}
      defaultForm={DEFAULT}
      seedData={SEED}
    />
  );
}
