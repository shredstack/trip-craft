"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plus, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const linkStyle = (href: string): React.CSSProperties => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return {
      padding: "8px 20px",
      borderRadius: 100,
      fontSize: 14,
      fontWeight: 500,
      textDecoration: "none",
      transition: "all 0.2s",
      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
      background: isActive ? "var(--bg-card)" : "transparent",
      border: isActive ? "1px solid var(--border)" : "1px solid transparent",
    };
  };

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
          <Link href="/" style={linkStyle("/")}>Home</Link>
          {isAuthenticated && (
            <Link href="/dashboard" style={linkStyle("/dashboard")}>My Trips</Link>
          )}
          {isAuthenticated && session?.user?.isAdmin && (
            <Link href="/admin" style={linkStyle("/admin")}>Admin</Link>
          )}
        </div>

        {/* Right side */}
        {isLoading ? (
          <div style={{ width: 160 }} />
        ) : isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user.name || session.user.email}
            </span>
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
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/login"
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                transition: "all 0.2s",
              }}
            >
              Log In
            </Link>
            <Link
              href="/register"
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
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
