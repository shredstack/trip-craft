"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/user";
import { TRIP_TYPE_SCORES } from "@/lib/admin-constants";
import type { CatalogDestinationData } from "@/lib/types";

interface DestinationTableProps {
  destinations: CatalogDestinationData[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  draft: { bg: "rgba(251,191,36,0.15)", color: "var(--sand)", label: "Draft", icon: <FileText size={12} /> },
  published: { bg: "rgba(16,185,129,0.15)", color: "#6EE7B7", label: "Published", icon: <CheckCircle2 size={12} /> },
  archived: { bg: "rgba(100,116,139,0.15)", color: "var(--text-muted)", label: "Archived", icon: <Archive size={12} /> },
};

function getTopTripType(dest: CatalogDestinationData): string {
  let maxScore = 0;
  let topType = "";
  for (const { key, label } of TRIP_TYPE_SCORES) {
    const score = dest[key as keyof CatalogDestinationData] as number;
    if (score > maxScore) {
      maxScore = score;
      topType = label;
    }
  }
  return topType ? `${topType} (${maxScore})` : "-";
}

export function DestinationTable({ destinations, onRefresh }: DestinationTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = destinations.length > 0 && selected.size === destinations.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(destinations.map((d) => d.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAction(action: "publish" | "archive" | "delete") {
    if (action === "delete" && !confirm(`Delete ${selected.size} destinations? This cannot be undone.`)) {
      return;
    }
    setBulkLoading(true);
    try {
      await apiFetch("/api/admin/destinations/bulk-action", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      onRefresh();
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setBulkLoading(false);
    }
  }

  const cellStyle: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 13,
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
  };

  const headerStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    background: "var(--bg-dark)",
    position: "sticky",
    top: 0,
  };

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {selected.size} selected
          </span>
          <Button
            variant="secondary"
            onClick={() => handleBulkAction("publish")}
            disabled={bulkLoading}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8 }}
          >
            <CheckCircle2 size={12} />
            Publish
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleBulkAction("archive")}
            disabled={bulkLoading}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8 }}
          >
            <Archive size={12} />
            Archive
          </Button>
          <Button
            variant="back"
            onClick={() => handleBulkAction("delete")}
            disabled={bulkLoading}
            style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, color: "var(--coral)" }}
          >
            <Trash2 size={12} />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ accentColor: "var(--ocean)" }}
                />
              </th>
              <th style={headerStyle}>Name</th>
              <th style={headerStyle}>Country</th>
              <th style={headerStyle}>Continent</th>
              <th style={headerStyle}>Cost Tier</th>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Top Type</th>
              <th style={headerStyle}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((dest) => {
              const sc = statusConfig[dest.status] || statusConfig.draft;
              return (
                <tr
                  key={dest.id}
                  onClick={() => router.push(`/admin/destinations/${dest.id}`)}
                  style={{
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    style={cellStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOne(dest.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(dest.id)}
                      onChange={() => toggleOne(dest.id)}
                      style={{ accentColor: "var(--ocean)" }}
                    />
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 600, color: "var(--text-primary)" }}>
                    {dest.name}
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>{dest.country}</td>
                  <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>{dest.continent}</td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {dest.costTier}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 100,
                        background: sc.bg,
                        color: sc.color,
                      }}
                    >
                      {sc.icon}
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>
                    {getTopTripType(dest)}
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(dest.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {destinations.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            No destinations found. Try adjusting your filters or generate a new batch.
          </div>
        )}
      </div>
    </div>
  );
}
