import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listings, listingVotes, users } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/server-auth";
import { fetchOpenGraph, isValidHttpUrl } from "@/lib/og";

type Voter = { id: number; name: string };

/**
 * GET /api/listings — public. Each listing carries its up/down voter lists
 * (names), so the client renders counts AND derives the current user's own vote
 * without sending identity to this read endpoint.
 */
export async function GET() {
  const db = getDb();
  const rows = await db.select().from(listings).orderBy(desc(listings.createdAt));

  // one query for all votes, joined to user names; grouped in JS
  const voteRows = await db
    .select({
      listingId: listingVotes.listingId,
      value: listingVotes.value,
      userId: listingVotes.userId,
      name: users.name,
    })
    .from(listingVotes)
    .innerJoin(users, eq(listingVotes.userId, users.id));

  const up = new Map<number, Voter[]>();
  const down = new Map<number, Voter[]>();
  for (const v of voteRows) {
    const target = v.value > 0 ? up : down;
    const list = target.get(v.listingId) ?? [];
    list.push({ id: v.userId, name: v.name });
    target.set(v.listingId, list);
  }

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      imageUrl: r.imageUrl,
      description: r.description,
      addedBy: r.addedBy,
      createdAt: r.createdAt,
      upVoters: up.get(r.id) ?? [],
      downVoters: down.get(r.id) ?? [],
    })),
  );
}

/** POST /api/listings — admin only. Adds a listing, scraping OG if needed. */
export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.isAdmin)
    return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!isValidHttpUrl(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }

  let title = typeof body?.title === "string" ? body.title.trim() : "";
  let image = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  let description =
    typeof body?.description === "string" ? body.description.trim() : "";
  // "manual" if the admin supplied preview fields, else we scrape ("auto")
  let source = title || image ? "manual" : "auto";

  if (!title && !image) {
    const og = await fetchOpenGraph(url);
    title = og.title ?? "";
    image = og.image ?? "";
    description = og.description ?? "";
    source = "auto";
  }

  const db = getDb();
  const inserted = await db
    .insert(listings)
    .values({
      url,
      title: title || null,
      imageUrl: image || null,
      description: description || null,
      source,
      addedBy: user.id,
    })
    .returning();

  const r = inserted[0];
  return NextResponse.json(
    {
      id: r.id,
      url: r.url,
      title: r.title,
      imageUrl: r.imageUrl,
      description: r.description,
      addedBy: r.addedBy,
      createdAt: r.createdAt,
      upVoters: [],
      downVoters: [],
    },
    { status: 201 },
  );
}
