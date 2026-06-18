import styles from "./ListingFacts.module.css";

type Props = {
  summary: string | null;
  rating: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  pricePerNight: number | null;
};

/**
 * Structured listing facts parsed from the scraped title (rating/bed/bath) plus
 * the manual price — a clean meta line instead of one smushed title string.
 * Renders nothing when there's nothing to show.
 */
export default function ListingFacts({
  summary,
  rating,
  bedrooms,
  beds,
  baths,
  pricePerNight,
}: Props) {
  const meta: string[] = [];
  if (summary) meta.push(summary);
  if (rating != null) meta.push(`★ ${rating}`);
  if (bedrooms != null) meta.push(`${bedrooms} BR`);
  if (beds != null) meta.push(`${beds} bed${beds === 1 ? "" : "s"}`);
  if (baths != null) meta.push(`${baths} ba`);

  if (meta.length === 0 && pricePerNight == null) return null;

  return (
    <div className={styles.facts}>
      {meta.length > 0 && <span className={styles.meta}>{meta.join(" · ")}</span>}
      {pricePerNight != null && (
        <span className={styles.price}>${pricePerNight}/night</span>
      )}
    </div>
  );
}
