"use client";

import { Chip } from "@/components/ui/Chip";
import type { TripCriteria } from "@/lib/types";

interface StepPreferencesProps {
  criteria: TripCriteria;
  onChange: (updates: Partial<TripCriteria>) => void;
}

const tripTypes = [
  { label: "🏖 Beach", value: "Beach" },
  { label: "🏔 Adventure", value: "Adventure" },
  { label: "🏛 Culture", value: "Culture" },
  { label: "🌿 Nature", value: "Nature" },
  { label: "🌆 City", value: "City" },
  { label: "🏨 Resort", value: "Resort" },
  { label: "🎢 Theme Park", value: "Theme Park" },
  { label: "🚢 Cruise", value: "Cruise" },
];

const priorities = [
  { label: "👶 Kid-Friendly", value: "Kid-Friendly" },
  { label: "🧘 Relaxation", value: "Relaxation" },
  { label: "🍽 Great Food", value: "Great Food" },
  { label: "🛡 Safety", value: "Safety" },
  { label: "📸 Scenic", value: "Scenic" },
  { label: "🌙 Nightlife", value: "Nightlife" },
];

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function StepPreferences({ criteria, onChange }: StepPreferencesProps) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "-1px",
          marginBottom: 8,
        }}
      >
        What&apos;s your vibe?
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 40 }}>
        Pick one or more trip styles
      </p>

      {/* Trip Types */}
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "var(--text-secondary)",
          marginBottom: 16,
        }}
      >
        Trip Type
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
        {tripTypes.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            selected={criteria.tripTypes.includes(t.value)}
            onClick={() => onChange({ tripTypes: toggleItem(criteria.tripTypes, t.value) })}
          />
        ))}
      </div>

      {/* Priorities */}
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "var(--text-secondary)",
          marginBottom: 16,
        }}
      >
        Priorities
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {priorities.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            selected={criteria.priorities.includes(p.value)}
            onClick={() => onChange({ priorities: toggleItem(criteria.priorities, p.value) })}
          />
        ))}
      </div>
    </div>
  );
}
