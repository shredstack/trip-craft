"use client";

import { useState, useEffect } from "react";

const funFacts = [
  "🌊 The best time to visit the Caribbean is December through April...",
  "🏖 Over 60% of family travelers say beach access is their #1 priority...",
  "✈ Booking flights 3-4 months ahead typically saves 15-20%...",
  "🌴 Mexico's Riviera Maya has 50+ kid-friendly excursion options...",
  "🐠 The Great Barrier Reef has over 1,500 species of fish...",
  "🏔 Costa Rica was ranked #1 for family adventure travel in 2024...",
  "🍽 Families spend an average of 25% of their trip budget on food...",
];

export function LoadingScreen() {
  const [factIndex, setFactIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % funFacts.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 100,
        textAlign: "center",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 64,
          height: 64,
          border: "4px solid var(--border)",
          borderTopColor: "var(--ocean)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: 32,
        }}
      />

      <h2
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Crafting your perfect trip...
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 40 }}>
        Analyzing destinations, excursions, and real traveler data
      </p>

      {/* Fun fact */}
      <p
        style={{
          fontStyle: "italic",
          color: "var(--text-muted)",
          fontSize: 14,
          maxWidth: 500,
          transition: "opacity 300ms ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {funFacts[factIndex]}
      </p>
    </div>
  );
}
