"use client";

import { motion } from "framer-motion";

const features = [
  {
    icon: "🎯",
    title: "Smart Matching",
    description:
      "Enter your criteria — kid ages, budget, flight time, vibe — and get destinations ranked by fit.",
    color: "var(--coral)",
    bg: "rgba(255,107,90,0.15)",
  },
  {
    icon: "🗺",
    title: "Full Trip Blueprints",
    description:
      "Get excursions, logistics, packing tips, and things most people forget to book in advance.",
    color: "var(--ocean)",
    bg: "rgba(14,165,233,0.15)",
  },
  {
    icon: "⭐",
    title: "Real Data Backed",
    description:
      "Recommendations validated with Google Places ratings, real reviews, and recent traveler experiences.",
    color: "var(--tropical)",
    bg: "rgba(16,185,129,0.15)",
  },
];

export function FeatureCards() {
  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "20px 40px 80px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * (i + 1) }}
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
              transition: "all 0.3s",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: feature.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 20,
              }}
            >
              {feature.icon}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {feature.title}
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
