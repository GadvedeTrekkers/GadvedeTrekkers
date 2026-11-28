import { useState } from "react";
import ManagePage from "./ManagePage";
import { isHeritageEnabled, setHeritageEnabled } from "../data/featureFlags";

const FIELDS = [
  { key: "name",          label: "Walk Name",       required: true, col: 8 },
  { key: "type",          label: "Category",        required: true, type: "select", options: ["city", "forts", "temples"] },
  { key: "location",      label: "Location",        required: true, placeholder: "Pune" },
  { key: "duration",      label: "Duration",        required: true, placeholder: "2-3 Hours" },
  { key: "price",         label: "Price (₹)",       required: true, type: "number", placeholder: "499" },
  { key: "originalPrice", label: "Original Price (₹)", type: "number", placeholder: "799" },
  { key: "nextDate",      label: "Next Date",       placeholder: "20 Oct 2025" },
  { key: "rating",        label: "Rating (1-5)",    type: "number", placeholder: "4.8" },
  { key: "image",         label: "Image URL",       col: 12, placeholder: "https://..." },
  {
    key: "description", label: "Walk Description", type: "textarea", col: 12,
    placeholder: "Describe the heritage walk — what visitors will see, experience, and learn.",
    aiPrompt: (form) => `Write a 100–130 word description for the heritage walk: "${form.name || "[Walk Name]"}" — a ${form.duration || "[Duration]"} ${form.type || "heritage"} walk in ${form.location || "[Location]"}, priced at ₹${form.price || "?"} per person.

Cover:
1. What this walk explores (forts, temples, streets, history)
2. The experience and atmosphere
3. What participants will learn or discover
4. Who should attend (history buffs, families, students, tourists)

Style: engaging, informative, tourism-friendly. Output only the description text.`,
  },
];

const DEFAULT = {
  name: "", type: "city", location: "", duration: "",
  price: "", originalPrice: "", nextDate: "", rating: "", image: "", description: "", active: true,
};

export default function ManageHeritage() {
  const [enabled, setEnabled] = useState(isHeritageEnabled());

  const handleToggle = () => {
    const next = !enabled;
    setHeritageEnabled(next);
    setEnabled(next);
  };

  return (
    <div>
      {/* ── Visibility Toggle ── */}
      <div style={{
        background: enabled ? "#d1fae5" : "#fef2f2",
        border: `1.5px solid ${enabled ? "#6ee7b7" : "#fca5a5"}`,
        borderRadius: 12,
        padding: "16px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: enabled ? "#065f46" : "#991b1b", marginBottom: 2 }}>
            🏛 Heritage Walk — {enabled ? "Visible on Website" : "Hidden from Website"}
          </div>
          <div style={{ fontSize: "0.82rem", color: enabled ? "#047857" : "#b91c1c" }}>
            {enabled
              ? "Heritage Walk section and nav links are currently shown to visitors."
              : "Heritage Walk is hidden from the homepage and all public UI. Turn on when events are available."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: enabled ? "#065f46" : "#991b1b" }}>
            {enabled ? "ON" : "OFF"}
          </span>
          <div
            onClick={handleToggle}
            style={{
              width: 52, height: 28, borderRadius: 999, cursor: "pointer",
              background: enabled ? "#059669" : "#d1d5db",
              position: "relative", transition: "background 0.25s",
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3,
              left: enabled ? 27 : 3,
              transition: "left 0.25s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </div>
        </div>
      </div>

      <ManagePage
        title="Heritage Walks"
        icon="🏛"
        storageKey="gt_heritage"
        fields={FIELDS}
        defaultForm={DEFAULT}
        seedData={[] /* t129u: no built-in catalogue; items come only from the database */}
      />
    </div>
  );
}
