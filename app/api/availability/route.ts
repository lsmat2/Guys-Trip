import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { availability, users } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/server-auth";
import { generateWeekends } from "@/lib/weekends";
import type { Voter } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/availability — public. Returns the rolling weekend list plus a map
 * of weekend-start -> users available that weekend (the public stat).
 */
export async function GET() {
  const db = getDb();
  const rows = await db
    .select({
      weekendStart: availability.weekendStart,
      userId: availability.userId,
      name: users.name,
    })
    .from(availability)
    .innerJoin(users, eq(availability.userId, users.id));

  const available: Record<string, Voter[]> = {};
  for (const r of rows) {
    (available[r.weekendStart] ??= []).push({ id: r.userId, name: r.name });
  }

  return NextResponse.json({ weekends: generateWeekends(), available });
}

/**
 * POST /api/availability — any signed-in user.
 * Body: { weekendStart: "yyyy-mm-dd", available: boolean }. Presence of a row
 * means available; toggling off deletes it.
 */
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const weekendStart = typeof body?.weekendStart === "string" ? body.weekendStart : "";
  const isAvailable = body?.available === true;

  if (!ISO_DATE.test(weekendStart)) {
    return NextResponse.json({ error: "Bad weekendStart." }, { status: 400 });
  }

  const db = getDb();
  if (isAvailable) {
    await db
      .insert(availability)
      .values({ userId: user.id, weekendStart })
      .onConflictDoNothing();
  } else {
    await db
      .delete(availability)
      .where(
        and(
          eq(availability.userId, user.id),
          eq(availability.weekendStart, weekendStart),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}
