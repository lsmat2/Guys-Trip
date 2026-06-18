import Card from "@/components/ui/Card";
import AvatarStack from "@/components/AvatarStack";
import type { ListingWithVotes } from "@/lib/types";
import styles from "./TopListing.module.css";

/** Net score driving the ranking: upvotes minus downvotes. */
export function netVotes(l: ListingWithVotes): number {
  return l.upVoters.length - l.downVoters.length;
}

/** A compact, ranked listing row for the home dashboard. Keeps the photo. */
export default function TopListing({
  rank,
  listing,
}: {
  rank: number;
  listing: ListingWithVotes;
}) {
  const net = netVotes(listing);
  const scoreClass =
    net > 0 ? styles.scorePos : net < 0 ? styles.scoreNeg : "";

  return (
    <Card className={styles.card}>
      <span className={styles.rank}>{rank}</span>
      {listing.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageUrl} alt="" className={styles.thumb} />
      )}
      <div className={styles.main}>
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.title}
        >
          {listing.title || listing.url}
        </a>
        {listing.upVoters.length > 0 && (
          <div className={styles.voters}>
            <AvatarStack voters={listing.upVoters} max={6} />
          </div>
        )}
      </div>
      <span className={`${styles.score} ${scoreClass}`}>
        {net > 0 ? `+${net}` : net}
      </span>
    </Card>
  );
}
