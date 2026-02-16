"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "My Trips" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(15,23,42,0.8)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tripcraft_logo.png"
            alt="TripCraft logo"
            width={100}
            height={100}
            style={{ borderRadius: 12 }}
          />
          <span
            className="gradient-text"
            style={{
              fontFamily: "var(--font-outfit)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            TripCraft
          </span>
        </Link>

        {/* Center nav links */}
        <div style={{ display: "flex", gap: 4 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href === "/dashboard" && pathname.startsWith("/dashboard"));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 20px",
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* New Trip button */}
        <Link
          href="/plan"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 12,
            background: "var(--gradient-sunset)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
            boxShadow: "0 4px 16px rgba(255,107,90,0.25)",
          }}
        >
          <Plus size={16} />
          New Trip
        </Link>
      </div>
    </nav>
  );
}
