import styles from "./ListingImage.module.css";

type Props = {
  src: string;
  /** optional city/town overlaid as a corner pill (listings page); omit on the
      compact dashboard thumb */
  city?: string | null;
  /** parent-supplied cosmetics (border, radius) — sizing is owned here */
  className?: string;
};

/**
 * Square, cropped listing photo. Stretches to its flex parent's full height and
 * derives an equal width from it (aspect-ratio 1), so vertical source images are
 * center-cropped instead of stretching the card. Reused by the listings cards
 * and the home dashboard rows.
 */
export default function ListingImage({ src, city, className }: Props) {
  return (
    <div className={[styles.media, className].filter(Boolean).join(" ")}>
      {/* arbitrary external image hosts → plain <img> (no next/image domain config) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={styles.image} />
      {city ? <span className={styles.cityBadge}>{city}</span> : null}
    </div>
  );
}
