import { NextResponse } from "next/server";
import { fetchOpenGraph, isValidHttpUrl, parseListingTitle } from "@/lib/og";

/**
 * GET /api/preview?url=... — server-side Open Graph scrape for the add form.
 * Returns the raw og fields plus the resolved display name and parsed facts, so
 * the form can show what the listing will look like. Returns nulls (not an
 * error) when the site blocks scraping, so the UI can offer manual entry.
 */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!isValidHttpUrl(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }
  const og = await fetchOpenGraph(url);
  const facts = parseListingTitle(og.title);
  return NextResponse.json({
    ...og,
    name: og.description || og.title,
    ...facts,
  });
}
