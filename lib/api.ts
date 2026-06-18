import type { CurrentUser } from "@/lib/auth";

/** Headers that carry the acting user's identity to mutation endpoints. */
export function userHeaders(user: CurrentUser | null): Record<string, string> {
  return user ? { "x-user-id": String(user.id) } : {};
}

/** Shared SWR fetcher for JSON GET endpoints. */
export const jsonFetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`);
    return r.json();
  });
