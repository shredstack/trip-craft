"use client";

import { Sparkles } from "lucide-react";

interface AIReasoningCardProps {
  reasoning: string;
  matchScore: number | null;
}

export function AIReasoningCard({ reasoning, matchScore }: AIReasoningCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gradient accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "var(--gradient-ocean)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(14,165,233,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={18} style={{ color: "var(--ocean-light)" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-outfit)" }}>
            Why We Recommend This
          </h3>
          {matchScore != null && (
            <span style={{ fontSize: 12, color: "var(--ocean-light)" }}>
              {matchScore}% match to your preferences
            </span>
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--text-secondary)",
        }}
      >
        {reasoning}
      </p>
    </div>
  );
}
