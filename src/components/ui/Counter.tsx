"use client";

import { Minus, Plus } from "lucide-react";

interface CounterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Counter({ label, value, min = 0, max = 10, onChange }: CounterProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)",
            background: "var(--bg-card)",
            color: value <= min ? "var(--text-muted)" : "var(--text-primary)",
            cursor: value <= min ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            opacity: value <= min ? 0.5 : 1,
          }}
        >
          <Minus size={16} />
        </button>
        <span
          className="font-mono-stat"
          style={{
            fontSize: 18,
            fontWeight: 700,
            minWidth: 24,
            textAlign: "center",
          }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)",
            background: "var(--bg-card)",
            color: value >= max ? "var(--text-muted)" : "var(--text-primary)",
            cursor: value >= max ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            opacity: value >= max ? 0.5 : 1,
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
