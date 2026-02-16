"use client";

const tabs = [
  { id: "destinations", label: "Destinations" },
  { id: "excursions", label: "Excursions" },
  { id: "logistics", label: "Logistics" },
  { id: "notes", label: "Notes" },
];

interface DetailTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

export function DetailTabs({ active, onChange }: DetailTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid var(--border)",
        marginBottom: 32,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--ocean)" : "transparent"}`,
              marginBottom: -2,
              color: isActive ? "var(--ocean-light)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
