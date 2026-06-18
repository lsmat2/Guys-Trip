# Goon Trip

A lightweight, friends-only web app for planning a group trip. It replaces messy group texts
with two structured tools: voting on places to stay and marking which weekends everyone is free.
Viewing is open to all; only listed admins can add places.

## Features

- **Listings** — browse candidate places, upvote/downvote them, and see who voted. Admins add a
  place by pasting a URL; Open Graph metadata (title, image, description) is scraped automatically,
  with a manual fallback.
- **Weekends** — a rolling list of upcoming weekends (next ~6 months). Mark yourself free for any
  weekend and see who else is. Available as a month-grid calendar or a list.
- **Home dashboard** — the top 3 listings by net votes (upvotes − downvotes, earliest-created wins
  ties) and the most popular weekend by availability (ties shown together).
- **Profiles, no passwords** — pick a name like a streaming-service profile; identity lives in
  `localStorage`. Any action that writes data prompts you to pick a profile first.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Neon](https://neon.tech) serverless Postgres via [Drizzle ORM](https://orm.drizzle.team)
- [SWR](https://swr.vercel.app) for client data fetching with optimistic updates
- Plain CSS Modules + design tokens in `app/globals.css` (no UI library)
- Hosted on [Vercel](https://vercel.com)

## Getting started

### Prerequisites

- Node.js 20+
- A Postgres database (Neon recommended; provision via the Vercel Marketplace)

### Environment

Create `.env.local` in the project root:

```bash
DATABASE_URL=postgres://...        # Neon connection string (or `vercel env pull`)
ADMIN_USERS=Leo,Alex               # comma-separated names allowed to add/delete listings
```

### Install and run

```bash
npm install
npm run db:push     # sync the Drizzle schema to your database
npm run dev         # start the dev server at http://localhost:3000
```

To exercise shared, attributed state locally, open a normal window and an incognito window (two
independent `localStorage`s), create a profile in each, and confirm votes/availability from one
appear in the other after a refresh.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run db:generate` | Generate a SQL migration from schema changes |
| `npm run db:migrate` | Apply generated migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Project structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full data model, API surface, frontend
structure, and the decisions behind them. In brief:

```
app/         routes + API route handlers (App Router)
components/  UI primitives (components/ui) and feature components
lib/         db client + schema, auth context, weekend generation, OG scraping, types
drizzle/     generated migrations
docs/        architecture notes
```

## Deployment

Deploys to Vercel. Set `DATABASE_URL` and `ADMIN_USERS` in the project's environment variables and
run a schema push/migration against the production database. Pushing to `main` triggers a deploy.

> Note on identity: profiles are unauthenticated by design — admin enforcement is only as strong as
> knowing an admin name. This is intentional for a small, trusted friend group and is structured so
> real auth can later be added behind the existing `lib/auth` boundary.
