"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DestinationTable } from "@/components/admin/DestinationTable";
import { apiFetch } from "@/lib/user";
import { CONTINENTS, COST_TIERS, CATALOG_STATUSES } from "@/lib/admin-constants";
import type { CatalogDestinationData } from "@/lib/types";

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<CatalogDestinationData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState("all");
  const [continent, setContinent] = useState("");
  const [costTier, setCostTier] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (continent) params.set("continent", continent);
    if (costTier) params.set("costTier", costTier);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "50");

    try {
      const res = await apiFetch(`/api/admin/destinations?${params}`);
      const data = await res.json();
      setDestinations(data.destinations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Failed to fetch destinations:", err);
    } finally {
      setLoading(false);
    }
  }, [status, continent, costTier, search, page]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px",
    background: "var(--bg-dark)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xs)",
    color: "var(--text-primary)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: 28, fontWeight: 700 }}>
            Destinations
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            {total} total destinations
          </p>
        </div>
        <Link
          href="/admin/generate"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
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
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="all">All Statuses</option>
          {CATALOG_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select value={continent} onChange={(e) => { setContinent(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Continents</option>
          {CONTINENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={costTier} onChange={(e) => { setCostTier(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Cost Tiers</option>
          {COST_TIERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, country..."
              style={{
                ...selectStyle,
                paddingLeft: 32,
                width: 200,
              }}
            />
          </div>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading...</p>
      ) : (
        <DestinationTable destinations={destinations} onRefresh={fetchDestinations} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              cursor: page <= 1 ? "default" : "pointer",
              opacity: page <= 1 ? 0.5 : 1,
              color: "var(--text-secondary)",
              display: "flex",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              cursor: page >= totalPages ? "default" : "pointer",
              opacity: page >= totalPages ? 0.5 : 1,
              color: "var(--text-secondary)",
              display: "flex",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
