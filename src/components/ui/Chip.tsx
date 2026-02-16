"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: 100,
        border: `1.5px solid ${selected ? "var(--ocean)" : "var(--border)"}`,
        background: selected ? "rgba(14,165,233,0.15)" : "var(--bg-card)",
        color: selected ? "var(--ocean-light)" : "var(--text-secondary)",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label}
    </button>
  );
}
