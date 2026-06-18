import styles from "./ListingNotes.module.css";

type Props = {
  /** short, high-signal notes; each becomes a pill */
  notes: string[];
  /** lets the host align/space the pill row for its own layout */
  className?: string;
};

/**
 * Admin-entered "important notes" as a wrapping row of pills (e.g. "Hot tub",
 * "$500 flight on Jun 12"). Renders nothing when there are no notes.
 */
export default function ListingNotes({ notes, className }: Props) {
  if (notes.length === 0) return null;

  return (
    <ul className={[styles.notes, className].filter(Boolean).join(" ")}>
      {notes.map((note, i) => (
        // notes aren't unique/stable; index is fine for this static list
        <li key={i} className={styles.note}>
          {note}
        </li>
      ))}
    </ul>
  );
}
