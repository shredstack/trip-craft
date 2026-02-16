"use client";

import type { TripCriteria } from "@/lib/types";

interface StepLogisticsProps {
  criteria: TripCriteria;
  onChange: (updates: Partial<TripCriteria>) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  background: "var(--bg-card)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: 15,
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "var(--text-secondary)",
  marginBottom: 8,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  paddingRight: 44,
};

export function StepLogistics({ criteria, onChange }: StepLogisticsProps) {
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
        The details
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 40 }}>
        Help us narrow down the perfect options
      </p>

      {/* Departing From */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Departing From</label>
        <input
          type="text"
          value={criteria.departCity}
          onChange={(e) => onChange({ departCity: e.target.value })}
          placeholder="Salt Lake City, UT"
          style={inputStyle}
        />
      </div>

      {/* Row: Max Flight + Budget */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Max Flight Time</label>
          <select
            value={criteria.maxFlight}
            onChange={(e) => onChange({ maxFlight: e.target.value })}
            style={selectStyle}
          >
            <option value="3 hours">3 hours</option>
            <option value="5 hours">5 hours</option>
            <option value="8 hours">8 hours</option>
            <option value="12 hours">12 hours</option>
            <option value="No limit">No limit</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Budget per Person</label>
          <select
            value={criteria.budget}
            onChange={(e) => onChange({ budget: e.target.value })}
            style={selectStyle}
          >
            <option value="$ (Under $1,000)">$ (Under $1,000)</option>
            <option value="$$ ($1,000–$2,500)">$$ ($1,000–$2,500)</option>
            <option value="$$$ ($2,500–$5,000)">$$$ ($2,500–$5,000)</option>
            <option value="$$$$ ($5,000+)">$$$$ ($5,000+)</option>
          </select>
        </div>
      </div>

      {/* Row: Travel Window + Duration */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Travel Window</label>
          <select
            value={criteria.travelMonth}
            onChange={(e) => onChange({ travelMonth: e.target.value })}
            style={selectStyle}
          >
            <option value="Flexible">Flexible</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Trip Duration</label>
          <select
            value={criteria.tripDuration}
            onChange={(e) => onChange({ tripDuration: e.target.value })}
            style={selectStyle}
          >
            <option value="Weekend (2-3 days)">Weekend (2-3 days)</option>
            <option value="Week (5-7 days)">Week (5-7 days)</option>
            <option value="Extended (8-14 days)">Extended (8-14 days)</option>
          </select>
        </div>
      </div>

      {/* Extra Notes */}
      <div>
        <label style={labelStyle}>Anything else?</label>
        <textarea
          value={criteria.extraNotes}
          onChange={(e) => onChange({ extraNotes: e.target.value })}
          placeholder="Allergies, must-sees, travel concerns, or anything else we should know..."
          rows={4}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 100,
          }}
        />
      </div>
    </div>
  );
}
