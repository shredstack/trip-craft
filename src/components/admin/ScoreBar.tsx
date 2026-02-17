"use client";

interface ScoreBarProps {
  score: number;
  label?: string;
  compact?: boolean;
}

export function ScoreBar({ score, label, compact }: ScoreBarProps) {
  const color =
    score >= 7
      ? "var(--tropical)"
      : score >= 4
        ? "var(--sand)"
        : "var(--text-muted)";

  const bgColor =
    score >= 7
      ? "rgba(16,185,129,0.15)"
      : score >= 4
        ? "rgba(251,191,36,0.15)"
        : "rgba(100,116,139,0.15)";

  if (compact) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 60 }}>
            {label}
          </span>
        )}
        <div
          style={{
            width: 60,
            height: 6,
            borderRadius: 3,
            background: "var(--bg-dark)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${score * 10}%`,
              height: "100%",
              borderRadius: 3,
              background: color,
              transition: "width 0.3s",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-space)",
            color,
            minWidth: 16,
            textAlign: "right",
          }}
        >
          {score}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            minWidth: 80,
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: "var(--bg-dark)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score * 10}%`,
            height: "100%",
            borderRadius: 4,
            background: color,
            transition: "width 0.3s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 13,
          fontFamily: "var(--font-space)",
          fontWeight: 700,
          color,
          background: bgColor,
          padding: "2px 8px",
          borderRadius: 6,
          minWidth: 32,
          textAlign: "center",
        }}
      >
        {score}
      </span>
    </div>
  );
}
