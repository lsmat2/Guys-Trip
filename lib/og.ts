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
