# Guys-Trip — MVP Architecture & Build Plan

## Context

`Guys-Trip` is a lightweight, friends-only web app to replace messy group-text vacation
planning with structured tools. It is **not** a polished public product — the goal is bare,
reliable functionality and a **clean, reusable structure that's easy to build off of** later
(more features will inevitably come). This document defines the stack, data model, and build
order so implementation is unambiguous.

### Why this shape (the one non-obvious decision)
Three of the four features need **shared, attributed state** across everyone's browsers —
all users see all listings, *who* voted, *who's* free each weekend, and a prefilled user
list. `localStorage` is per-device and cannot hold shared truth, so a small backend + DB is
required. `localStorage` keeps a smaller job: remembering *which profile you tapped*.

## Decisions (locked with user)

| Area | Decision |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** — React frontend *and* serverless API routes in one Vercel-deployed project |
| Database | **Neon Postgres** (free tier) via **Vercel Marketplace** — auto-injects `DATABASE_URL` |
| ORM | **Drizzle** — TS-native, no codegen, small cold starts, SQL-like (good while learning Postgres) |
| Identity | "Netflix profile" — tap an existing name or create one; stored in `localStorage`. **No passwords** (explicitly out of scope) |
| Adding listings | **Admin only** |
| Admin model | **Env var allowlist** `ADMIN_USERS` (comma-separated names), enforced server-side |
| Weekends | **Rolling next ~6 months**, auto-generated from server "today" (window = one constant) |
| Link previews | **Auto-fetch Open Graph + manual fallback** (Airbnb may block scraping); scraped values cached on the row |
| Styling | **Minimal** — plain CSS + CSS variables, small set of reusable primitives. No UI lib, no design polish yet |
| Data fetching | **SWR** (tiny, Vercel-made) for client fetch + revalidation; optimistic updates on vote/availability |

> Security note: identity is unauthenticated by design. Admin enforcement is only as strong as
> "knowing the admin name." Acceptable per explicit user request; structured so real auth can be
> added later behind the same `lib/auth` boundary.

## Tech Stack Summary
- Next.js (App Router), React, TypeScript
- Neon Postgres + Drizzle ORM (`drizzle-kit` for migrations)
- SWR for client data fetching
- `cheerio` (or lightweight HTML parse) for OG scraping in the preview endpoint
- Plain CSS Modules + `globals.css` design tokens
- Hosting: Vercel; remote already at `github.com/lsmat2/Guys-Trip`

## Data Model (Drizzle schema — `lib/db/schema.ts`)

```
users
  id          serial PK
  name        text unique not null
  created_at  timestamptz default now()

listings
  id          serial PK
  url         text not null
  title       text
  image_url   text
  description text
  source      text            -- 'auto' | 'manual' (how preview was filled)
  added_by    int FK users.id
  created_at  timestamptz default now()

listing_votes
  id          serial PK
  listing_id  int FK listings.id (on delete cascade)
  user_id     int FK users.id
  value       smallint not null      -- +1 up, -1 down
  created_at  timestamptz default now()
  UNIQUE(listing_id, user_id)         -- one vote per user per listing (upsert/toggle)

availability
  id            serial PK
  user_id       int FK users.id
  weekend_start date not null          -- canonical weekend key (the Friday's date)
  created_at    timestamptz default now()
  UNIQUE(user_id, weekend_start)        -- row present = available; delete row = not available
```

**Weekends are computed, not stored.** `lib/weekends.ts` generates the rolling list of upcoming
weekends (each identified by its Friday date, labeled "Fri–Sun, weekend of <date>") for the next
`WEEKEND_WINDOW_MONTHS` (constant, default 6). Availability rows key off `weekend_start`.

## API Routes (App Router Route Handlers under `app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/users` | GET | List all users (+ `isAdmin` computed from `ADMIN_USERS`) for the profile picker |
| `/api/users` | POST | Create user `{name}` (dedupe on name) |
| `/api/listings` | GET | Listings + vote tallies (up/down counts) + voter name lists |
| `/api/listings` | POST | **Admin only** — add listing `{url, title?, imageUrl?}`; scrapes OG if not provided |
| `/api/listings/[id]` | DELETE | **Admin only** — remove a listing |
| `/api/listings/[id]/vote` | POST | `{userId, value}` upsert; same value again clears the vote (toggle) |
| `/api/availability` | GET | Weekend list + map `weekend_start -> [users]` (who's free) |
| `/api/availability` | POST | `{userId, weekendStart, available}` toggle |
| `/api/preview` | GET | `?url=` server-side OG scrape → `{title, image, description}` for the admin add form |

All mutating routes validate `userId`/admin **server-side** (don't trust the client). OG values
are cached onto the `listings` row at creation so previews persist even if Airbnb later blocks.

## Frontend Structure

```
app/
  layout.tsx                 # CurrentUserProvider + global ProfilePicker modal mount
  page.tsx                   # simple nav hub (or redirect to /listings)
  listings/page.tsx          # listing list, votes, public stats; admin-only add form
  weekends/page.tsx          # weekend calendar, toggle availability, public stats
  api/...                    # route handlers above
components/
  ui/                        # Button, Card, Modal, Stack — bare CSS primitives (reusable core)
  ProfilePicker.tsx          # Netflix-style picker + "add new"
  ListingCard.tsx            # preview image, title, VoteButtons, voter name lists
  VoteButtons.tsx            # up/down with counts + optimistic toggle
  WeekendCalendar.tsx        # rows/grid of weekends, availability toggle, who's-free counts
  AddListingForm.tsx         # admin only; paste URL → preview → confirm/manual override
lib/
  db/ (client.ts, schema.ts) # Drizzle client + schema
  auth.tsx                   # useCurrentUser() context, localStorage, requireSignIn gate, isAdmin
  weekends.ts                # rolling-weekend generator (WEEKEND_WINDOW_MONTHS)
  og.ts                      # fetch + parse Open Graph tags
drizzle/                     # generated migrations
```

**Identity & gating flow:** `useCurrentUser()` reads `localStorage`. Viewing is always open.
Any mutating action (vote, set availability, add listing) checks `currentUser`; if absent it
opens the `ProfilePicker` modal ("Who are you?"), then retries the action. Admin UI (`AddListingForm`,
delete buttons) shows only when `currentUser.isAdmin`.

## Styling Approach
- `globals.css` defines CSS variables (a few neutral colors, spacing scale, max-width container).
- Centered single-column container, basic card/button styles, readable defaults. No theme system,
  no animations. Each component owns a small `.module.css`. Priority = consistency + reuse, not beauty.

## Environment Variables
- `DATABASE_URL` — auto-provisioned by Neon/Vercel Marketplace (also pulled locally via `vercel env pull`)
- `ADMIN_USERS` — comma-separated admin names (e.g. `Leo`)

## Build Sequence
1. **Scaffold** Next.js + TS, `globals.css` tokens, `ui/` primitives. Push → confirm Vercel preview deploy works (CI/CD baseline).
2. **DB** — provision Neon via Marketplace, wire Drizzle client, write `schema.ts`, generate + run first migration.
3. **Identity** — `/api/users` (GET/POST), `useCurrentUser` context, `ProfilePicker`, localStorage, gating modal.
4. **Listings** — `/api/preview` OG scrape; `AddListingForm` (admin); `/api/listings` GET/POST/DELETE; `/api/listings/[id]/vote`; `ListingCard` + `VoteButtons` + public voter stats.
5. **Weekends** — `lib/weekends.ts`; `/api/availability` GET/POST; `WeekendCalendar` toggle + who's-free stats.
6. **Polish** — consistent minimal styling pass; nav between pages; empty/loading states.

## Verification (end-to-end)
- **Local multi-user:** `npm run dev`; open a normal window + an incognito window (two independent `localStorage`s). Create user A and user B. Vote / set availability as A → refresh B → confirm the shared state appears with A's name attributed.
- **Gating:** in a fresh window (no profile), click a vote → confirm the ProfilePicker prompts before the action completes.
- **Admin:** set `ADMIN_USERS` to include only A. Confirm add/delete listing UI + API succeed for A and are rejected for B.
- **OG preview:** paste a real Airbnb URL in the add form → confirm preview image/title appears, OR the manual fallback fields engage on failure; confirm the cached preview persists after reload.
- **Deploy:** push to `main` → Vercel preview/prod deploy; set `DATABASE_URL` + `ADMIN_USERS` in Vercel; run a migration against Neon; smoke-test on a phone (simulates the real friend-group usage).
```
