"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ItineraryEventCard,
  type ItineraryEventData,
} from "./ItineraryEventCard";

interface BackupPoolProps {
  events: ItineraryEventData[];
  tripId: string;
  onUpdateEvent: (event: ItineraryEventData) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function BackupPool({
  events,
  tripId,
  onUpdateEvent,
  onDeleteEvent,
}: BackupPoolProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: "backup-pool",
    data: { type: "backup" },
  });

  // Group by backupCategory
  const grouped = events.reduce<Record<string, ItineraryEventData[]>>(
    (acc, evt) => {
      const cat = evt.backupCategory || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(evt);
      return acc;
    },
    {}
  );

  const eventIds = events.map((e) => e.id);

  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: "2px solid var(--border)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: collapsed ? 0 : 8,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              textAlign: "left",
            }}
          >
            Backup Options & Swaps
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textAlign: "left",
              marginTop: 4,
            }}
          >
            Mix and match if plans change. Drag events into your itinerary days above.
          </p>
        </div>
        <span style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: 12 }}>
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </span>
      </button>

      {!collapsed && (
        <div
          ref={setNodeRef}
          style={{
            marginTop: 16,
            padding: 16,
            border: `2px dashed ${isOver ? "var(--ocean-light)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            background: isOver ? "rgba(14,165,233,0.03)" : "transparent",
            transition: "all 0.2s",
            minHeight: 80,
          }}
        >
          <SortableContext
            items={eventIds}
            strategy={verticalListSortingStrategy}
          >
            {events.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                No backup events. Drag events here to save them as alternatives.
              </div>
            ) : (
              Object.entries(grouped).map(([category, catEvents]) => (
                <div key={category} style={{ marginBottom: 20 }}>
                  <h4
                    style={{
                      fontFamily: "var(--font-outfit)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--coral)",
                      marginBottom: 8,
                      paddingBottom: 6,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {category}
                  </h4>
                  {catEvents.map((event) => (
                    <ItineraryEventCard
                      key={event.id}
                      event={event}
                      tripId={tripId}
                      onUpdate={onUpdateEvent}
                      onDelete={onDeleteEvent}
                    />
                  ))}
                </div>
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
