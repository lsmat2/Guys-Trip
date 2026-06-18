import { NextResponse } from "next/server";
import { fetchOpenGraph, isValidHttpUrl } from "@/lib/og";

/**
 * GET /api/preview?url=... — server-side Open Graph scrape for the add form.
 * Returns nulls (not an error) when the site blocks scraping, so the UI can
 * offer manual entry.
 */
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!isValidHttpUrl(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL." }, { status: 400 });
  }
  const og = await fetchOpenGraph(url);
  return NextResponse.json(og);
}
