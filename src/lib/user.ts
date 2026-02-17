"use client";

/**
 * Simplified fetch wrapper. With NextAuth, authentication is handled via
 * session cookies automatically — no custom headers needed.
 */
export function apiFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
