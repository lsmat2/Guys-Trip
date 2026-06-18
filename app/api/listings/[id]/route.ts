import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listings, listingVotes, users } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/server-auth";
import { isValidHttpUrl } from "@/lib/og";
import { type Voter, toClientListing, parsePrice, parseNotes } from "@/lib/listings";

/**
 * PATCH /api/listings/[id] — admin only. Edits all editable fields at once
 * (url, raw title, image, description, price, notes). Marks the row "manual"
 * since an admin touched it, then returns the updated client listing.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!isValidHttpUrl(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const image = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const importantNotes = parseNotes(body?.importantNotes);

  const db = getDb();
  const updated = await db
    .update(listings)
    .set({
      url,
      title: title || null,
      imageUrl: image || null,
      description: description || null,
      pricePerNight: parsePrice(body?.pricePerNight),
      importantNotes: importantNotes.length ? importantNotes : null,
      source: "manual",
    })
    .where(eq(listings.id, id))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  // re-read this listing's votes so the response carries the full client shape
  const voteRows = await db
    .select({
      value: listingVotes.value,
      userId: listingVotes.userId,
      name: users.name,
    })
    .from(listingVotes)
    .innerJoin(users, eq(listingVotes.userId, users.id))
    .where(eq(listingVotes.listingId, id));

  const up: Voter[] = [];
  const down: Voter[] = [];
  for (const v of voteRows) {
    (v.value > 0 ? up : down).push({ id: v.userId, name: v.name });
  }

  return NextResponse.json(toClientListing(updated[0], up, down));
}

/** DELETE /api/listings/[id] — admin only. Votes cascade-delete. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  const db = getDb();
  await db.delete(listings).where(eq(listings.id, id));
  return NextResponse.json({ ok: true });
}
