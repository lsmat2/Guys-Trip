/** Client-facing shapes returned by the API (mirrors route JSON). */

export type Voter = { id: number; name: string };

export type ListingWithVotes = {
  id: number;
  url: string;
  /** resolved display name (the real listing name, not the parsed facts) */
  title: string | null;
  /** raw scraped title (the "smush" parsed into facts) — for the admin editor */
  rawTitle: string | null;
  /** raw scraped description (the real listing name) — for the admin editor */
  description: string | null;
  imageUrl: string | null;
  /** lead descriptor parsed from the scraped title, e.g. "Home in Cartagena" */
  summary: string | null;
  rating: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  /** manual nightly price (whole units), or null if unset */
  pricePerNight: number | null;
  /** admin-entered short notes, rendered as pills; [] when none */
  importantNotes: string[];
  addedBy: number | null;
  /** ISO timestamp; used to tiebreak equal-vote rankings (earliest wins). */
  createdAt: string;
  upVoters: Voter[];
  downVoters: Voter[];
};

export type WeekendInfo = {
  /** ISO date of the Friday (canonical weekend key), e.g. "2026-06-19" */
  start: string;
  /** display label, e.g. "Jun 19–21" */
  label: string;
};

export type AvailabilityData = {
  weekends: WeekendInfo[];
  /** weekend start date -> users available that weekend */
  available: Record<string, Voter[]>;
};
