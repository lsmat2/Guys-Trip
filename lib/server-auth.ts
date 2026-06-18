import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdminName } from "@/lib/admin";

export type RequestUser = { id: number; name: string; isAdmin: boolean };

/**
 * Resolve the acting user from the `x-user-id` header.
 *
 * This is the single server-side identity chokepoint for mutations. There's no
 * password (by design) — identity is "as strong as knowing a user id" — but
 * every write validates the id against the DB and recomputes admin status here,
 * so the client can never self-declare admin.
 */
export async function getRequestUser(req: Request): Promise<RequestUser | null> {
  const raw = req.headers.get("x-user-id");
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) return null;

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const u = rows[0];
  if (!u) return null;

  return { id: u.id, name: u.name, isAdmin: isAdminName(u.name) };
}
