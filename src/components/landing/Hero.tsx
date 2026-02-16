"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "80px 40px 40px",
        textAlign: "center",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "inline-block",
          padding: "8px 20px",
          borderRadius: 100,
          background: "rgba(255,107,90,0.1)",
          border: "1px solid rgba(255,107,90,0.2)",
          color: "var(--coral)",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 32,
        }}
      >
        ✨ AI-Powered Travel Planning
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1.1,
          marginBottom: 24,
        }}
      >
        Craft Your
        <br />
        <span className="gradient-text">Perfect Trip</span>
      </h1>

      {/* Subtext */}
      <p
        style={{
          fontSize: 17,
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          maxWidth: 560,
          margin: "0 auto 40px",
        }}
      >
        Tell us your dream vacation and we&apos;ll find the best destinations, excursions, and insider
        tips — backed by real traveler data and AI smarts.
      </p>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <Link
          href="/plan"
          style={{
            padding: "16px 36px",
            borderRadius: 14,
            background: "var(--gradient-sunset)",
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(255,107,90,0.35)",
            transition: "all 0.2s",
          }}
        >
          Plan a Trip
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: "16px 36px",
            borderRadius: 14,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          My Trips
        </Link>
      </div>
    </motion.section>
  );
}
