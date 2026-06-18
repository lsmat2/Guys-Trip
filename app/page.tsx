import Link from "next/link";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Stack from "@/components/ui/Stack";

export default function Home() {
  return (
    <Container>
      <h1>Goon Trip</h1>

      <Stack gap={12} style={{ marginTop: 24 }}>
        <Link href="/listings" style={{ textDecoration: "none" }}>
          <Card className="clickable">
            <strong>Listings</strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)" }}>
              Browse places and upvote / downvote them.
            </p>
          </Card>
        </Link>

        <Link href="/weekends" style={{ textDecoration: "none" }}>
          <Card className="clickable">
            <strong>Weekends</strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)" }}>
              Mark which weekends you&apos;re free.
            </p>
          </Card>
        </Link>
      </Stack>
    </Container>
  );
}
