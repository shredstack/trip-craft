"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Pencil, Check, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/user";

interface TripDetailHeaderProps {
  trip: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    destinations: Array<{ id: string }>;
  };
  onNameChange: (name: string) => void;
  onStatusChange: (status: string) => void;
}

const statusOptions = ["DREAMING", "PLANNING", "BOOKED", "COMPLETED", "ARCHIVED"];

export function TripDetailHeader({ trip, onNameChange, onStatusChange }: TripDetailHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(trip.name);

  const date = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleSaveName = async () => {
    if (editName.trim() && editName !== trip.name) {
      await apiFetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim() }),
      });
      onNameChange(editName.trim());
    }
    setEditing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await apiFetch(`/api/trips/${trip.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(newStatus);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <Link
        href="/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-muted)",
          textDecoration: "none",
          fontSize: 14,
          marginBottom: 20,
          transition: "color 0.2s",
        }}
      >
        <ArrowLeft size={16} />
        Back to My Trips
      </Link>

      {/* Trip name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {editing ? (
          <>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-1px",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid var(--ocean)",
                color: "var(--text-primary)",
                outline: "none",
                padding: "0 0 4px 0",
              }}
            />
            <button
              onClick={handleSaveName}
              style={{
                background: "none",
                border: "none",
                color: "var(--tropical)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => {
                setEditName(trip.name);
                setEditing(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: "var(--font-outfit)",
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-1px",
              }}
            >
              {trip.name}
            </h1>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Pencil size={16} />
            </button>
          </>
        )}
      </div>

      {/* Info row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Status dropdown */}
        <select
          value={trip.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "transparent",
            position: "absolute",
            width: 0,
            height: 0,
            opacity: 0,
          }}
          id="status-select"
        />
        <button
          onClick={() => {
            const currentIndex = statusOptions.indexOf(trip.status);
            const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
            handleStatusChange(nextStatus);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          title="Click to change status"
        >
          <StatusBadge status={trip.status} />
        </button>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <MapPin size={14} />
          {trip.destinations.length} destination{trip.destinations.length !== 1 ? "s" : ""}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <Calendar size={14} />
          {date}
        </span>
      </div>
    </div>
  );
}
