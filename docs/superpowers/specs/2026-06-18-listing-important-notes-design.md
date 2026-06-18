# Listing "Important notes" — Design

**Date:** 2026-06-18
**Status:** Approved (ready for implementation plan)

## Problem

Listings currently carry a scraped title, image, parsed facts (summary/rating/
bedrooms/beds/baths), and a manual nightly price. There's no place to capture the
ad-hoc, high-signal context that actually drives a group decision — things like
"hot tub included", "right on the ocean", or "$500 cheap flight on Jun 12".

These are heterogeneous and there are usually several per listing, so a single
free-text `description` is the wrong shape. We want a **list** of short notes that
each render as a discrete, scannable UI element.

## Decisions (locked with user)

| Area | Decision |
|---|---|
| Storage | Postgres `text[]` array column `important_notes` on `listings` |
| Migration | `npm run db:push` (matches how `price_per_night` was applied — no generated migration file) |
| Display | **Pills / chips** — a wrapping row of rounded badges |
| Entry UX | **Textarea, one note per line** in the admin add form |
| Edit scope | **Creation-only** for now (no edit endpoint/UI — consistent with the current add-and-delete-only model) |

## Architecture

The feature follows the existing listing data flow:

```
schema.ts (text[] column)
  → db:push to Neon
  → POST /api/listings  (parseNotes: validate + cap)
  → row.importantNotes
  → toClientListing()   (coerce null → [])
  → ListingWithVotes.importantNotes: string[]
  → <ListingNotes notes={...} />  (pills)
```

### 1. Schema — `lib/db/schema.ts`

Add to the `listings` table:

```ts
// admin-entered list of short, high-signal notes (e.g. "Hot tub included",
// "$500 flight on Jun 12"). Ordered; rendered as pills.
importantNotes: text("important_notes").array(),
```

Column is nullable (no default). An absent/empty list stores `null`. Applied with
`npm run db:push` against Neon (schema is the source of truth; this matches the
precedent set by `price_per_night`, which has no generated migration file either).

### 2. API — `app/api/listings/route.ts`

**Read** — in `toClientListing()`:
```ts
importantNotes: r.importantNotes ?? [],
```
Always an array to the client, so the UI never null-checks.

**Write** — a `parseNotes(raw: unknown): string[]` helper used by `POST`:
- Returns `[]` for anything that isn't an array.
- Maps each item with `String(...)`, trims, drops empty strings.
- Sanity caps: at most **12** notes, each truncated to **140** chars. These are
  server-side guards so a malformed/hostile client can't bloat the row (mirrors the
  defensive `parsePrice` already in this file).

On insert, store `notes.length ? notes : null`.

### 3. Types — `lib/types.ts`

Add to `ListingWithVotes`:
```ts
/** admin-entered short notes, rendered as pills; [] when none */
importantNotes: string[];
```

### 4. Entry — `components/AddListingForm.tsx` (+ `components/ui/Textarea.tsx`)

- Add a `notes` string state and a **textarea** field labeled "Important notes
  (one per line)".
- On `submit()`, derive the array:
  ```ts
  const importantNotes = notes
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  ```
  Include `importantNotes` in the POST body. Reset `notes` on success alongside the
  other fields.
- Add a small reusable `ui/Textarea` primitive (mirrors `ui/Input` — same border,
  radius, focus-ring tokens) rather than a one-off `<textarea>`, since the app
  deliberately maintains a shared primitive set.
- Optional polish: render a live `<ListingNotes>` preview of the parsed notes in the
  form's preview area (next to the facts preview).

### 5. Display — `components/ListingNotes.tsx` (+ `.module.css`)

New presentational component, factored like `ListingFacts`:
```tsx
function ListingNotes({ notes, className }: { notes: string[]; className?: string })
```
- Returns `null` when `notes` is empty.
- Renders a wrapping flex row of pill `<span>`s.
- Styling uses existing tokens: `--surface-2` background, `--border`, `--radius`,
  small muted text, `--space-2` gaps. No new colors.

### 6. Wire-in — `components/ListingCard.tsx`

Render `<ListingNotes notes={listing.importantNotes} className={styles.notes} />`
immediately below `<ListingFacts>` in the card body. The dashboard `TopListing` row
is intentionally left unchanged to keep it compact.

## Out of scope (this spec)

- **Editing notes on existing listings.** Covered by the follow-up below.

## Follow-up (next feature, separate spec)

**Admin listing editor modal.** A per-listing **Edit** button (rendered next to the
admin **Delete** button on `ListingCard`) opens a modal — similar to the existing
add-listing modal — that lets an admin edit *all* fields of a listing at once: the
URL, scraped title, image/link preview, description, price, and the important notes
introduced here. This will require:
- A `PATCH /api/listings/[id]` route (admin-only) that updates the editable columns.
- A shared editor form (likely refactoring `AddListingForm` into a create/edit form,
  or a sibling `EditListingForm`) mounted in a modal.

This spec deliberately ships notes as **creation-only** first; the editor lands next
and will provide the edit path for notes (and every other field) together.

## Testing / verification

- **Migration:** `npm run db:push` succeeds; `important_notes` column exists on
  `listings` in Neon.
- **Create with notes:** as an admin, add a listing with 3 newline-separated notes →
  card shows 3 pills; reload persists them.
- **Empty notes:** add a listing with no notes → no pills, no empty container,
  column stored as `null`.
- **Guards:** posting >12 notes or a 500-char note → server truncates/caps; row stays
  sane.
- **Variable length:** a short tag and a sentence-length note both render and wrap
  cleanly on a phone-width viewport.
- **Non-admin:** the add form (and thus notes entry) remains admin-only; GET exposes
  `importantNotes` publicly as part of each listing.
