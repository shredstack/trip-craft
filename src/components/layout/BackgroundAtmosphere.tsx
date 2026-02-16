"use client";

export function BackgroundAtmosphere() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Top-right coral blob */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,90,0.08) 0%, transparent 70%)",
          animation: "floatBlob 20s ease-in-out infinite",
        }}
      />
      {/* Bottom-left ocean blob */}
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
          animation: "floatBlob 25s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
