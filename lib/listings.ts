import type { listings } from "@/lib/db/schema";
import { parseListingTitle } from "@/lib/og";

/** Shared listing helpers used by the list (GET/POST) and item (PATCH) routes. */

export type Voter = { id: number; name: string };

type ListingRow = typeof listings.$inferSelect;

/**
 * Map a DB row to the client shape: the real name (og:description, else the
 * raw title) becomes `title`, and the Airbnb "smush" stored in `title` is
 * parsed into structured facts on read. The raw `rawTitle`/`description`
 * columns are passed through too, so the admin editor can prefill losslessly.
 */
export function toClientListing(r: ListingRow, up: Voter[], down: Voter[]) {
  const facts = parseListingTitle(r.title);
  const name = r.description?.trim() || r.title || r.url;
  return {
    id: r.id,
    url: r.url,
    title: name,
    rawTitle: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    summary: facts.summary,
    city: facts.city,
    rating: facts.rating,
    bedrooms: facts.bedrooms,
    beds: facts.beds,
    baths: facts.baths,
    pricePerNight: r.pricePerNight,
    importantNotes: r.importantNotes ?? [],
    addedBy: r.addedBy,
    createdAt: r.createdAt,
    upVoters: up,
    downVoters: down,
  };
}

/** Coerce a request body price into a non-negative whole number, else null. */
export function parsePrice(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Max notes per listing and max chars per note — server-side sanity guards. */
const MAX_NOTES = 12;
const MAX_NOTE_LEN = 140;

/**
 * Normalize a request body `importantNotes` into a clean string[]: trims each
 * entry, drops empties, and caps count/length so a malformed client can't bloat
 * the row. Returns [] for anything that isn't an array.
 */
export function parseNotes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((n) => String(n).trim().slice(0, MAX_NOTE_LEN))
    .filter(Boolean)
    .slice(0, MAX_NOTES);
}
