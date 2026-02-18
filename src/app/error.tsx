"use client";

import Link from "next/link";

export default function GlobalError({
  error,
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
        Something went wrong
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: 8,
          fontSize: 15,
        }}
      >
        An unexpected error occurred. This has been logged for investigation.
      </p>
      {error.digest && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            marginBottom: 24,
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
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
          Try Again
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
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
