"use client";

const filters = [
  { value: "ALL", label: "All" },
  { value: "DREAMING", label: "✨ Dreaming" },
  { value: "PLANNING", label: "📋 Planning" },
  { value: "BOOKED", label: "✅ Booked" },
];

interface StatusFiltersProps {
  active: string;
  onChange: (status: string) => void;
}

export function StatusFilters({ active, onChange }: StatusFiltersProps) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            style={{
              padding: "8px 20px",
              borderRadius: 100,
              border: `1.5px solid ${isActive ? "var(--ocean)" : "var(--border)"}`,
              background: isActive ? "rgba(14,165,233,0.1)" : "transparent",
              color: isActive ? "var(--ocean-light)" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
