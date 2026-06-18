/** Client-facing shapes returned by the API (mirrors route JSON). */

export type Voter = { id: number; name: string };

export type ListingWithVotes = {
  id: number;
  url: string;
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  addedBy: number | null;
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
