import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Lazy singleton DB client (Neon serverless HTTP driver).
 *
 * Lazy so importing this module never touches DATABASE_URL at build time —
 * the connection is created on first query (request time) instead. This keeps
 * `next build` working even if the env var isn't present in that environment.
 */
let _db: NeonHttpDatabase<typeof schema> | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Provision Neon (Vercel Marketplace) and run `vercel env pull .env.local`.",
      );
    }
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export { schema };
