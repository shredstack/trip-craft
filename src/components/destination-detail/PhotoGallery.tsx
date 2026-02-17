"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: photos.length === 1
            ? "1fr"
            : photos.length === 2
              ? "1fr 1fr"
              : "repeat(3, 1fr)",
          gap: 8,
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
      >
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            style={{
              aspectRatio: i === 0 && photos.length > 2 ? "16/9" : "4/3",
              gridColumn: i === 0 && photos.length > 2 ? "1 / -1" : undefined,
              background: `url(${url}) center/cover`,
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
              transition: "opacity 0.2s",
            }}
          />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
              }}
            >
              <X size={24} />
            </button>
            <motion.img
              key={selectedIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={photos[selectedIndex]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "var(--radius)",
              }}
            />

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(
                      selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1
                    );
                  }}
                  style={{
                    position: "absolute",
                    left: 20,
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: 48,
                    height: 48,
                    fontSize: 24,
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(
                      selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1
                    );
                  }}
                  style={{
                    position: "absolute",
                    right: 20,
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: 48,
                    height: 48,
                    fontSize: 24,
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
