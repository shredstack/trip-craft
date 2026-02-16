"use client";

import { Counter } from "@/components/ui/Counter";
import type { TripCriteria } from "@/lib/types";

interface StepTravelersProps {
  criteria: TripCriteria;
  onChange: (updates: Partial<TripCriteria>) => void;
}

export function StepTravelers({ criteria, onChange }: StepTravelersProps) {
  const handleChildAgeChange = (index: number, value: string) => {
    const newAges = [...criteria.childAges];
    newAges[index] = parseInt(value) || 0;
    onChange({ childAges: newAges });
  };

  const handleChildrenChange = (count: number) => {
    const newAges = [...criteria.childAges];
    if (count > newAges.length) {
      while (newAges.length < count) newAges.push(5);
    } else {
      newAges.length = count;
    }
    onChange({ children: count, childAges: newAges });
  };

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
        Who&apos;s going?
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 40 }}>
        Tell us about your travel crew
      </p>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "8px 28px",
          marginBottom: 24,
        }}
      >
        <Counter
          label="Adults"
          value={criteria.adults}
          min={1}
          max={10}
          onChange={(v) => onChange({ adults: v })}
        />
        <div style={{ borderTop: "1px solid var(--border)" }} />
        <Counter
          label="Children"
          value={criteria.children}
          min={0}
          max={8}
          onChange={handleChildrenChange}
        />
      </div>

      {criteria.children > 0 && (
        <div>
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
            Children&apos;s Ages
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {criteria.childAges.map((age, i) => (
              <input
                key={i}
                type="number"
                min={0}
                max={17}
                value={age}
                onChange={(e) => handleChildAgeChange(i, e.target.value)}
                style={{
                  width: 100,
                  padding: "14px 16px",
                  background: "var(--bg-card)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: 15,
                  textAlign: "center",
                  fontFamily: "var(--font-space)",
                  fontWeight: 700,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
