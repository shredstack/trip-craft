"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "action" | "back";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--gradient-sunset)",
    border: "none",
    color: "white",
    borderRadius: 14,
    boxShadow: "0 8px 32px rgba(255,107,90,0.35)",
    padding: "14px 32px",
    fontSize: 16,
    fontWeight: 600,
  },
  secondary: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    borderRadius: 14,
    padding: "14px 32px",
    fontSize: 16,
    fontWeight: 600,
  },
  action: {
    background: "var(--gradient-ocean)",
    border: "none",
    color: "white",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 600,
  },
  back: {
    background: "transparent",
    border: "1.5px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: 12,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 500,
  },
};

export function Button({ variant = "primary", children, style, ...props }: ButtonProps) {
  const baseStyles = variantStyles[variant];

  return (
    <button
      style={{
        ...baseStyles,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
