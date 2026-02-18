"use client";

import Link from "next/link";

export default function ResultsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "80px 40px",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Results couldn&apos;t load
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: 24,
          fontSize: 15,
        }}
      >
        Something went wrong while loading your trip results. Your trip may
        still be generating — try again or check your dashboard.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px",
            borderRadius: 14,
            background: "var(--gradient-sunset)",
            color: "white",
            border: "none",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          style={{
            padding: "12px 28px",
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          My Trips
        </Link>
        <Link
          href="/plan"
          style={{
            padding: "12px 28px",
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          Plan New Trip
        </Link>
      </div>
    </div>
  );
}
