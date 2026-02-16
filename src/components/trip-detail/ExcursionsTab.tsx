"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/user";

interface Excursion {
  id: string;
  name: string;
  type: string;
  description: string | null;
  priceEstimate: string | null;
  duration: string | null;
  kidFriendly: boolean;
  minAge: number | null;
  kidNotes: string | null;
  destination: {
    id: string;
    name: string;
  };
}

interface ExcursionsTabProps {
  excursions: Excursion[];
  tripId: string;
  destinations: Array<{ id: string; name: string }>;
  onAdd: (excursion: Excursion) => void;
}

const typeConfig: Record<string, { color: string; bg: string }> = {
  ADVENTURE: { color: "var(--coral)", bg: "rgba(255,107,90,0.15)" },
  CULTURE: { color: "#A78BFA", bg: "rgba(139,92,246,0.15)" },
  FOOD: { color: "var(--sand)", bg: "rgba(251,191,36,0.15)" },
  NATURE: { color: "#6EE7B7", bg: "rgba(16,185,129,0.15)" },
  RELAXATION: { color: "var(--ocean-light)", bg: "rgba(14,165,233,0.15)" },
  NIGHTLIFE: { color: "#A78BFA", bg: "rgba(139,92,246,0.15)" },
  SHOPPING: { color: "var(--sand)", bg: "rgba(251,191,36,0.15)" },
  OTHER: { color: "var(--text-muted)", bg: "rgba(100,116,139,0.15)" },
};

export function ExcursionsTab({ excursions, tripId, destinations, onAdd }: ExcursionsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "OTHER",
    description: "",
    priceEstimate: "",
    duration: "",
    kidFriendly: true,
    destinationId: destinations[0]?.id || "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.destinationId) return;

    try {
      const res = await apiFetch(`/api/trips/${tripId}/excursions`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const newExcursion = await res.json();
      const dest = destinations.find((d) => d.id === formData.destinationId);
      onAdd({ ...newExcursion, destination: dest || { id: formData.destinationId, name: "Unknown" } });
      setFormData({ name: "", type: "OTHER", description: "", priceEstimate: "", duration: "", kidFriendly: true, destinationId: destinations[0]?.id || "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add excursion:", err);
    }
  };

  if (excursions.length === 0 && !showForm) {
    return (
      <div>
        <EmptyState
          icon="🎿"
          title="No excursions yet"
          description="Generate recommendations to get excursion ideas, or add your own."
        />
        {destinations.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "12px 24px",
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
              Add Custom Excursion
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {excursions.map((exc) => (
          <ExcursionCard key={exc.id} excursion={exc} />
        ))}
      </div>

      {/* Add button */}
      {destinations.length > 0 && !showForm && (
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
          Add Custom Excursion
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 24,
          }}
        >
          <h4 style={{ fontFamily: "var(--font-outfit)", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            New Excursion
          </h4>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Excursion name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select
                value={formData.destinationId}
                onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                style={inputStyle}
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={inputStyle}
              >
                {Object.keys(typeConfig).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                placeholder="Price estimate"
                value={formData.priceEstimate}
                onChange={(e) => setFormData({ ...formData, priceEstimate: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                style={inputStyle}
              />
            </div>
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
                Add Excursion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const config = typeConfig[excursion.type] || typeConfig.OTHER;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 24,
      }}
    >
      {/* Type badge */}
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "var(--radius-xs)",
          background: config.bg,
          color: config.color,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 12,
        }}
      >
        {excursion.type}
      </span>

      <h4 style={{ fontFamily: "var(--font-outfit)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        {excursion.name}
      </h4>
      {excursion.description && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
          {excursion.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-muted)" }}>
          {excursion.priceEstimate && <span>{excursion.priceEstimate}</span>}
          {excursion.duration && <span>{excursion.duration}</span>}
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: excursion.kidFriendly ? "var(--tropical)" : "var(--coral)",
          }}
        >
          {excursion.kidFriendly ? "✓ Kid-Friendly" : "⚠ Not for young kids"}
        </span>
      </div>

      {/* Destination attribution */}
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        📍 {excursion.destination.name}
      </div>
    </div>
  );
}
