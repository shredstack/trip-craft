import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
      <h3
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 400, marginBottom: ctaLabel ? 24 : 0 }}>
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          style={{
            padding: "12px 28px",
            borderRadius: 14,
            background: "var(--gradient-sunset)",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(255,107,90,0.35)",
            transition: "all 0.2s",
          }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
