"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ITINERARY_EVENT_CATEGORIES } from "@/lib/constants";
import { apiFetch } from "@/lib/user";
import type { ItineraryEventData } from "./ItineraryEventCard";

interface AddEventFormProps {
  tripId: string;
  dayId?: string | null;
  onAdd: (event: ItineraryEventData) => void;
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "var(--bg-dark)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-xs)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};

export function AddEventForm({ tripId, dayId, onAdd }: AddEventFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "OTHER",
    name: "",
    description: "",
    tips: "",
    location: "",
    startTime: "",
    endTime: "",
    timeLabel: "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      const res = await apiFetch(`/api/trips/${tripId}/itinerary/events`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          dayId: dayId || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          timeLabel: formData.timeLabel || null,
        }),
      });
      const newEvent = await res.json();
      onAdd(newEvent);
      setFormData({
        category: "OTHER",
        name: "",
        description: "",
        tips: "",
        location: "",
        startTime: "",
        endTime: "",
        timeLabel: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add event:", err);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          width: "100%",
          padding: "10px",
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius-xs)",
          background: "none",
          color: "var(--text-muted)",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: 8,
          transition: "all 0.2s",
        }}
      >
        <Plus size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
        Add Event
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-dark)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-xs)",
        padding: 16,
        marginTop: 8,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Event name"
            style={inputStyle}
          />
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            style={inputStyle}
          >
            {ITINERARY_EVENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Description"
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            style={inputStyle}
          />
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            style={inputStyle}
          />
          <input
            value={formData.timeLabel}
            onChange={(e) =>
              setFormData({ ...formData, timeLabel: e.target.value })
            }
            placeholder="e.g. Morning"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowForm(false)}
            style={{
              padding: "8px 16px",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-xs)",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "var(--radius-xs)",
              background: "var(--gradient-ocean)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
