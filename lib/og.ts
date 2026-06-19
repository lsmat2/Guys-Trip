/**
 * Minimal Open Graph scraper (server-only).
 *
 * Fetches a URL with a browser-like User-Agent and pulls og:title / og:image /
 * og:description from the HTML. No dependency — regex over meta tags is enough
 * for the link-preview use case. Returns nulls on failure so callers can fall
 * back to manual entry (Airbnb in particular may block bots).
 */

export type OgData = {
  title: string | null;
  image: string | null;
  description: string | null;
};

/** Structured facts parsed from an Airbnb-style og:title. */
export type ListingFacts = {
  /** the lead descriptor, e.g. "Home in Cartagena" */
  summary: string | null;
  /** city/town pulled from the summary, e.g. "Cartagena" (Airbnb hides region) */
  city: string | null;
  rating: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
};

/**
 * Parse an Airbnb og:title like
 *   "Home in Cartagena · ★4.91 · 6 bedrooms · 6 beds · 5.5 private baths"
 * into structured facts. Anything not present (or a non-Airbnb title with no
 * " · " segments) yields nulls. Done on read, so improving this re-parses every
 * listing without a migration.
 */
export function parseListingTitle(title: string | null): ListingFacts {
  const facts: ListingFacts = {
    summary: null,
    city: null,
    rating: null,
    bedrooms: null,
    beds: null,
    baths: null,
  };
  if (!title) return facts;

  for (const seg of title.split("·").map((s) => s.trim()).filter(Boolean)) {
    if (seg.includes("★")) {
      const m = seg.match(/([\d.]+)/); // "★New" has no number → rating stays null
      if (m) facts.rating = Number(m[1]);
      continue;
    }
    const bedrooms = seg.match(/^([\d.]+)\s*bedrooms?\b/i);
    if (bedrooms) {
      facts.bedrooms = Number(bedrooms[1]);
      continue;
    }
    const beds = seg.match(/^([\d.]+)\s*beds?\b/i);
    if (beds) {
      facts.beds = Number(beds[1]);
      continue;
    }
    const baths = seg.match(/^([\d.]+)\s*(?:private\s+|shared\s+)?baths?\b/i);
    if (baths) {
      facts.baths = Number(baths[1]);
      continue;
    }
    // first segment that isn't a rating/count is the descriptor
    if (facts.summary === null) facts.summary = seg;
  }

  // Airbnb summaries read "<type> in <City>" (e.g. "Home in Cartagena"). The
  // greedy ^.* anchors to the LAST " in " so "Room in home in Cartagena" yields
  // "Cartagena"; \b avoids matching the "in" inside words like "Cabin".
  if (facts.summary) {
    const m = facts.summary.match(/^.*\bin\s+(.+)$/i);
    if (m) facts.city = m[1].trim() || null;
  }

  return facts;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/** Find a <meta> content value by og/twitter property or name attribute. */
function metaContent(html: string, key: string): string | null {
  // matches both attribute orders: property=".." content=".." and reverse
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1].trim());
  }
  return null;
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeEntities(m[1].trim()) : null;
}

export async function fetchOpenGraph(url: string): Promise<OgData> {
  if (!isValidHttpUrl(url)) {
    return { title: null, image: null, description: null };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { title: null, image: null, description: null };

    const html = await res.text();
    return {
      title: metaContent(html, "og:title") ?? titleTag(html),
      image: metaContent(html, "og:image"),
      description: metaContent(html, "og:description"),
    };
  } catch {
    // network error / timeout / blocked — caller falls back to manual entry
    return { title: null, image: null, description: null };
  }
}
