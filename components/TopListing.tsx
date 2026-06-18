import Card from "@/components/ui/Card";
import AvatarStack from "@/components/AvatarStack";
import ListingFacts from "@/components/ListingFacts";
import type { ListingWithVotes } from "@/lib/types";
import styles from "./TopListing.module.css";

/** Net score driving the ranking: upvotes minus downvotes. */
export function netVotes(l: ListingWithVotes): number {
  return l.upVoters.length - l.downVoters.length;
}

/** A compact listing row for the home dashboard (already order-ranked by the
    parent — the position in the list conveys the ranking, no number needed). */
export default function TopListing({
  listing,
}: {
  listing: ListingWithVotes;
}) {
  return (
    <Card className={styles.card}>
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
        <ListingFacts
          className={styles.facts}
          summary={listing.summary}
          rating={listing.rating}
          bedrooms={listing.bedrooms}
          beds={listing.beds}
          baths={listing.baths}
          pricePerNight={listing.pricePerNight}
        />
        {listing.upVoters.length > 0 && (
          <div className={styles.voters}>
            {/* who upvoted — the avatar stack makes the count clear, so no
                separate net-score number is needed */}
            <AvatarStack voters={listing.upVoters} max={6} />
          </div>
        )}
      </div>
    </Card>
  );
}
