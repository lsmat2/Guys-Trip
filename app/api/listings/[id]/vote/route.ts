import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listingVotes } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/server-auth";

/**
 * POST /api/listings/[id]/vote — any signed-in user.
 * Body: { value: 1 | -1 }. Toggle semantics:
 *   - no existing vote  -> insert
 *   - same value again  -> remove (toggle off)
 *   - opposite value    -> switch
 * Returns the user's resulting vote (0 = none).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const listingId = Number((await params).id);
  if (!Number.isInteger(listingId)) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const value = body?.value === 1 || body?.value === -1 ? body.value : null;
  if (value === null) {
    return NextResponse.json({ error: "value must be 1 or -1." }, { status: 400 });
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(listingVotes)
    .where(
      and(eq(listingVotes.listingId, listingId), eq(listingVotes.userId, user.id)),
    )
    .limit(1);

  let resulting = value;
  if (!existing[0]) {
    await db.insert(listingVotes).values({ listingId, userId: user.id, value });
  } else if (existing[0].value === value) {
    // toggle off
    await db
      .delete(listingVotes)
      .where(
        and(eq(listingVotes.listingId, listingId), eq(listingVotes.userId, user.id)),
      );
    resulting = 0;
  } else {
    await db
      .update(listingVotes)
      .set({ value })
      .where(
        and(eq(listingVotes.listingId, listingId), eq(listingVotes.userId, user.id)),
      );
  }

  return NextResponse.json({ value: resulting });
}
