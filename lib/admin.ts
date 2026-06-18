/**
 * Admin allowlist — server-side source of truth.
 * ADMIN_USERS is a comma-separated list of names, e.g. "Leo,Jake".
 * Comparison is case-insensitive so "leo" and "Leo" both match.
 */
export function getAdminNames(): string[] {
  return (process.env.ADMIN_USERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdminName(name: string): boolean {
  const target = name.trim().toLowerCase();
  return getAdminNames().some((a) => a.toLowerCase() === target);
}
