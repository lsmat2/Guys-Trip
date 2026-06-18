import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { getRequestUser } from "@/lib/server-auth";

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
