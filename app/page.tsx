"use client";

import Link from "next/link";
import useSWR from "swr";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Stack from "@/components/ui/Stack";
import TopListing, { netVotes } from "@/components/TopListing";
import TopWeekend from "@/components/TopWeekend";
import { jsonFetcher } from "@/lib/api";
import type { AvailabilityData, ListingWithVotes } from "@/lib/types";
import styles from "./page.module.css";

const TOP_LISTINGS = 3;

/** Top listings by net votes (desc), tiebroken by earliest creation date. */
function topListings(listings: ListingWithVotes[]): ListingWithVotes[] {
  return [...listings]
    .sort((a, b) => {
      const byVotes = netVotes(b) - netVotes(a);
      if (byVotes !== 0) return byVotes;
      // ISO timestamps sort chronologically as strings — earliest first
      return a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, TOP_LISTINGS);
}

/** The weekend(s) with the most users available; ties are all returned. */
function topWeekends(data: AvailabilityData) {
  const counts = data.weekends.map((w) => ({
    weekend: w,
    voters: data.available[w.start] ?? [],
  }));
  const max = counts.reduce((m, c) => Math.max(m, c.voters.length), 0);
  return max > 0 ? counts.filter((c) => c.voters.length === max) : [];
}

/** Section title that links into its full page (the nav, kept minimal). */
function SectionLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={styles.sectionLink}>
      {children}
      <span className={styles.arrow} aria-hidden>
        ↗
      </span>
    </Link>
  );
}

export default function Home() {
  const { data: listings, isLoading: listingsLoading } = useSWR<
    ListingWithVotes[]
  >("/api/listings", jsonFetcher);
  const { data: availability, isLoading: availabilityLoading } =
    useSWR<AvailabilityData>("/api/availability", jsonFetcher);

  const anyVotes =
    listings?.some((l) => l.upVoters.length + l.downVoters.length > 0) ?? false;
  const ranked = listings ? topListings(listings) : [];
  const bestWeekends = availability ? topWeekends(availability) : [];

  return (
    <Container>
      <section className={styles.section}>
        <SectionLink href="/listings">Top listings</SectionLink>
        {listingsLoading ? (
          <p className={styles.muted}>Loading…</p>
        ) : !anyVotes ? (
          <Card>
            <span className={styles.muted}>No votes yet.</span>
          </Card>
        ) : (
          <Stack gap={12}>
            {ranked.map((l) => (
              <TopListing key={l.id} listing={l} />
            ))}
          </Stack>
        )}
      </section>

      <section className={styles.section}>
        <SectionLink href="/weekends">Most popular weekend</SectionLink>
        {availabilityLoading ? (
          <p className={styles.muted}>Loading…</p>
        ) : bestWeekends.length === 0 ? (
          <Card>
            <span className={styles.muted}>No availability yet.</span>
          </Card>
        ) : (
          <Stack gap={12}>
            {bestWeekends.map(({ weekend, voters }) => (
              <TopWeekend key={weekend.start} weekend={weekend} voters={voters} />
            ))}
          </Stack>
        )}
      </section>
    </Container>
  );
}
