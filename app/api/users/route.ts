import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdminName } from "@/lib/admin";

const MAX_NAME = 40;

/** GET /api/users — list all users for the profile picker (public). */
export async function GET() {
  const db = getDb();
  const rows = await db.select().from(users).orderBy(asc(users.name));
  return NextResponse.json(
    rows.map((u) => ({ id: u.id, name: u.name, isAdmin: isAdminName(u.name) })),
  );
}

/** POST /api/users — create (or return existing) user by name. No password. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME} characters or fewer.` },
      { status: 400 },
    );
  }

  const db = getDb();

  // Case-insensitive dedupe: reuse an existing profile with the same name.
  const existing = await db
    .select()
    .from(users)
    .where(sql`lower(${users.name}) = lower(${name})`)
    .limit(1);

  if (existing[0]) {
    const u = existing[0];
    return NextResponse.json({ id: u.id, name: u.name, isAdmin: isAdminName(u.name) });
  }

  try {
    const inserted = await db.insert(users).values({ name }).returning();
    const u = inserted[0];
    return NextResponse.json(
      { id: u.id, name: u.name, isAdmin: isAdminName(u.name) },
      { status: 201 },
    );
  } catch {
    // Unique-constraint race: fetch and return the now-existing row.
    const again = await db.select().from(users).where(eq(users.name, name)).limit(1);
    if (again[0]) {
      const u = again[0];
      return NextResponse.json({ id: u.id, name: u.name, isAdmin: isAdminName(u.name) });
    }
    return NextResponse.json({ error: "Could not create user." }, { status: 500 });
  }
}
