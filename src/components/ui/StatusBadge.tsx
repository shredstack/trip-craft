const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  DREAMING: { bg: "rgba(139,92,246,0.15)", color: "#A78BFA", label: "Dreaming" },
  PLANNING: { bg: "rgba(14,165,233,0.15)", color: "var(--ocean-light)", label: "Planning" },
  BOOKED: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7", label: "Booked" },
  COMPLETED: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7", label: "Completed" },
  ARCHIVED: { bg: "rgba(100,116,139,0.15)", color: "var(--text-muted)", label: "Archived" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DREAMING;

  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: config.bg,
        color: config.color,
        display: "inline-block",
      }}
    >
      {config.label}
    </span>
  );
}
