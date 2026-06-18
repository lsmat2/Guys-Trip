import {
  pgTable,
  serial,
  integer,
  smallint,
  text,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Schema = the single source of truth for shared state.
 * `drizzle-kit generate` reads this file to produce SQL migrations.
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  // raw scraped strings: title holds the og:title (Airbnb's "<type> in <city>
  // · ★rating · N bedrooms · …" smush, parsed into facts on read); description
  // holds the og:description (the real listing name).
  title: text("title"),
  imageUrl: text("image_url"),
  description: text("description"),
  // manual, optional — nightly price in whole units (e.g. USD). Not scrapeable.
  pricePerNight: integer("price_per_night"),
  // admin-entered list of short, high-signal notes (e.g. "Hot tub included",
  // "$500 flight on Jun 12"). Ordered; rendered as pills. null/absent = none.
  importantNotes: text("important_notes").array(),
  // how the preview was filled: "auto" (scraped) or "manual"
  source: text("source"),
  addedBy: integer("added_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const listingVotes = pgTable(
  "listing_votes",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(), // +1 up, -1 down
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  // one vote per user per listing — enables upsert/toggle
  (t) => [unique("uq_listing_user").on(t.listingId, t.userId)],
);

export const availability = pgTable(
  "availability",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // canonical weekend key (the Friday's date); row present = available
    weekendStart: date("weekend_start").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("uq_user_weekend").on(t.userId, t.weekendStart)],
);

// Inferred types reused across API + UI
export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingVote = typeof listingVotes.$inferSelect;
export type Availability = typeof availability.$inferSelect;
