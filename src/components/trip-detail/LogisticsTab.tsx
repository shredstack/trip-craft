"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/user";

interface TripItem {
  id: string;
  type: string;
  name: string;
  description: string | null;
}

interface LogisticsTabProps {
  items: TripItem[];
  tripId: string;
  onAdd: (item: TripItem) => void;
}

const defaultLogistics = [
  {
    icon: "✈",
    type: "FLIGHT",
    title: "Flights",
    description: "No flights booked yet. Tip: book 3-4 months ahead for best prices.",
    bg: "rgba(14,165,233,0.15)",
    color: "var(--ocean)",
  },
  {
    icon: "🏨",
    type: "HOTEL",
    title: "Hotel / Resort",
    description: "No accommodations booked yet. Compare all-inclusive vs. hotel + excursions separately.",
    bg: "rgba(255,107,90,0.15)",
    color: "var(--coral)",
  },
  {
    icon: "🚗",
    type: "CAR_RENTAL",
    title: "Transportation",
    description: "Consider: airport transfers, rental car, or resort shuttle.",
    bg: "rgba(16,185,129,0.15)",
    color: "var(--tropical)",
  },
  {
    icon: "📋",
    type: "DOCUMENT",
    title: "Documents",
    description: "Check: passports, travel insurance, vaccination requirements.",
    bg: "rgba(251,191,36,0.15)",
    color: "var(--sand)",
  },
];

const inputStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "var(--bg-dark)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-xs)",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
};

export function LogisticsTab({ items, tripId, onAdd }: LogisticsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: "OTHER", name: "", description: "" });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    try {
      const res = await apiFetch(`/api/trips/${tripId}/items`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const item = await res.json();
      onAdd(item);
      setFormData({ type: "OTHER", name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  };

  // Group user items by type
  const itemsByType: Record<string, TripItem[]> = {};
  items.forEach((item) => {
    if (!itemsByType[item.type]) itemsByType[item.type] = [];
    itemsByType[item.type].push(item);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {defaultLogistics.map((logistic) => (
        <div key={logistic.type}>
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              background: "var(--bg-card)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: logistic.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {logistic.icon}
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{logistic.title}</h4>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {logistic.description}
              </p>
              {/* Show user items for this type */}
              {itemsByType[logistic.type]?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: 13,
                  }}
                >
                  <strong>{item.name}</strong>
                  {item.description && (
                    <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                      — {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: "100%",
            padding: "16px",
            border: "2px dashed var(--border)",
            borderRadius: "var(--radius-sm)",
            background: "none",
            color: "var(--text-muted)",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          <Plus size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Add Logistics Item
        </button>
      ) : (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 24,
          }}
        >
          <h4 style={{ fontFamily: "var(--font-outfit)", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            New Logistics Item
          </h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={inputStyle}
              >
                <option value="FLIGHT">Flight</option>
                <option value="HOTEL">Hotel</option>
                <option value="CAR_RENTAL">Car Rental</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="INSURANCE">Insurance</option>
                <option value="DOCUMENT">Document</option>
                <option value="PACKING">Packing</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                placeholder="Item name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <input
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "10px 20px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-xs)",
                  background: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--gradient-ocean)",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
