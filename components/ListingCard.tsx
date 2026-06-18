"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import VoteButtons from "@/components/VoteButtons";
import UserBadges from "@/components/UserBadges";
import ListingFacts from "@/components/ListingFacts";
import ListingNotes from "@/components/ListingNotes";
import type { CurrentUser } from "@/lib/auth";
import type { ListingWithVotes } from "@/lib/types";
import styles from "./ListingCard.module.css";

type Props = {
  listing: ListingWithVotes;
  currentUser: CurrentUser | null;
  onVote: (listingId: number, value: 1 | -1) => void;
  onDelete: (listingId: number) => void;
};

export default function ListingCard({
  listing,
  currentUser,
  onVote,
  onDelete,
}: Props) {
  const myVote: 0 | 1 | -1 = currentUser
    ? listing.upVoters.some((v) => v.id === currentUser.id)
      ? 1
      : listing.downVoters.some((v) => v.id === currentUser.id)
        ? -1
        : 0
    : 0;

  const hasVoters = listing.upVoters.length > 0 || listing.downVoters.length > 0;

  return (
    <Card className={styles.card}>
      {listing.imageUrl && (
        <div className={styles.media}>
          {/* arbitrary external image hosts → plain <img> (no next/image domain config) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.imageUrl} alt="" className={styles.image} />
        </div>
      )}
      <div className={styles.body}>
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
        <ListingNotes notes={listing.importantNotes} className={styles.notes} />

        {hasVoters && (
          <div className={styles.voters}>
            {listing.upVoters.length > 0 && (
              <span className={styles.voterGroup}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/upvote.png" alt="up" className={styles.voterIcon} />
                <UserBadges voters={listing.upVoters} />
              </span>
            )}
            {listing.downVoters.length > 0 && (
              <span className={styles.voterGroup}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/downvote.png" alt="down" className={styles.voterIcon} />
                <UserBadges voters={listing.downVoters} />
              </span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <VoteButtons
            upCount={listing.upVoters.length}
            downCount={listing.downVoters.length}
            myVote={myVote}
            onVote={(value) => onVote(listing.id, value)}
          />
          {currentUser?.isAdmin && (
            <Button small variant="danger" onClick={() => onDelete(listing.id)}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
