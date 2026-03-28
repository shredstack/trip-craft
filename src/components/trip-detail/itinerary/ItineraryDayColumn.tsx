"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Calendar } from "lucide-react";
import {
  ItineraryEventCard,
  type ItineraryEventData,
} from "./ItineraryEventCard";

export interface ItineraryDayData {
  id: string;
  dayNumber: number;
  date: string | null;
  title: string;
  theme: string | null;
  events: ItineraryEventData[];
}

interface ItineraryDayColumnProps {
  day: ItineraryDayData;
  tripId: string;
  onUpdateEvent: (event: ItineraryEventData) => void;
  onDeleteEvent: (eventId: string) => void;
}

const DAY_COLORS = [
  "var(--ocean-light)",
  "var(--coral)",
  "var(--tropical)",
  "var(--sand)",
  "#A78BFA",
  "var(--ocean-light)",
  "var(--coral)",
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ItineraryDayColumn({
  day,
  tripId,
  onUpdateEvent,
  onDeleteEvent,
}: ItineraryDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: "day", dayId: day.id },
  });

  const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
  const eventIds = day.events.map((e) => e.id);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1.5px solid ${isOver ? color : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: 20,
        minHeight: 200,
        transition: "border-color 0.2s",
      }}
    >
      {/* Day header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `2px solid ${color}`,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-outfit)",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {day.dayNumber}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {day.date && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              <Calendar size={11} />
              {formatDate(day.date)}
            </div>
          )}
          <h3
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {day.title}
          </h3>
          {day.theme && (
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontStyle: "italic",
                marginTop: 2,
              }}
            >
              {day.theme}
            </p>
          )}
        </div>
      </div>

      {/* Events drop zone */}
      <div ref={setNodeRef} style={{ minHeight: 60 }}>
        <SortableContext items={eventIds} strategy={verticalListSortingStrategy}>
          {day.events.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius-xs)",
              }}
            >
              Drop events here
            </div>
          ) : (
            day.events.map((event) => (
              <ItineraryEventCard
                key={event.id}
                event={event}
                tripId={tripId}
                onUpdate={onUpdateEvent}
                onDelete={onDeleteEvent}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
