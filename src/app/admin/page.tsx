"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Sparkles, FileText, CheckCircle2, Archive } from "lucide-react";
import { apiFetch } from "@/lib/user";
import type { AdminStats } from "@/lib/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText size={16} style={{ color: "var(--sand)" }} />,
    published: <CheckCircle2 size={16} style={{ color: "var(--tropical)" }} />,
    archived: <Archive size={16} style={{ color: "var(--text-muted)" }} />,
  };

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-outfit)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Admin Dashboard
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Destination catalog overview and quick actions.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading stats...</p>
      ) : stats ? (
        <>
          {/* Quick Actions */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            <Link
              href="/admin/generate"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "var(--gradient-ocean)",
                color: "white",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
              }}
            >
              <Sparkles size={16} />
              Generate New Batch
            </Link>
            <Link
              href="/admin/destinations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Globe size={16} />
              Browse All Destinations
            </Link>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280, 1fr))",
              gap: 20,
            }}
          >
            {/* Total */}
            <StatCard title="Total Destinations" value={stats.total} />

            {/* By Status */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                By Status
              </h3>
              {Object.entries(stats.byStatus).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No destinations yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {statusIcons[status]}
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                          {status}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-space)", fontSize: 14, fontWeight: 700 }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Continent */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                By Continent
              </h3>
              {Object.entries(stats.byContinent).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No destinations yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(stats.byContinent)
                    .sort(([, a], [, b]) => b - a)
                    .map(([continent, count]) => (
                      <div key={continent} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{continent}</span>
                        <span style={{ fontFamily: "var(--font-space)", fontSize: 14, fontWeight: 700 }}>
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* By Cost Tier */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                By Cost Tier
              </h3>
              {Object.entries(stats.byCostTier).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No destinations yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(stats.byCostTier).map(([tier, count]) => (
                    <div key={tier} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", textTransform: "capitalize" }}>{tier}</span>
                      <span style={{ fontFamily: "var(--font-space)", fontSize: 14, fontWeight: 700 }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: "var(--coral)" }}>Failed to load stats</p>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 36,
          fontFamily: "var(--font-space)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
