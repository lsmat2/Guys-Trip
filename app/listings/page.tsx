"use client";

import { useState } from "react";
import useSWR from "swr";
import Container from "@/components/ui/Container";
import Stack from "@/components/ui/Stack";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ListingCard from "@/components/ListingCard";
import ListingForm from "@/components/ListingForm";
import { useAuth, type CurrentUser } from "@/lib/auth";
import { jsonFetcher, userHeaders } from "@/lib/api";
import type { ListingWithVotes } from "@/lib/types";

/** Apply the server's toggle semantics locally for an optimistic update. */
function applyVote(
  listing: ListingWithVotes,
  user: CurrentUser,
  value: 1 | -1,
): ListingWithVotes {
  const up = listing.upVoters.filter((v) => v.id !== user.id);
  const down = listing.downVoters.filter((v) => v.id !== user.id);
  const had: 0 | 1 | -1 = listing.upVoters.some((v) => v.id === user.id)
    ? 1
    : listing.downVoters.some((v) => v.id === user.id)
      ? -1
      : 0;

  // same value -> toggle off (don't re-add); otherwise set to new value
  if (had !== value) {
    if (value === 1) up.push({ id: user.id, name: user.name });
    else down.push({ id: user.id, name: user.name });
  }
  return { ...listing, upVoters: up, downVoters: down };
}

export default function ListingsPage() {
  const { currentUser, requireUser } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  // the listing currently being edited (admin), or null when the editor is closed
  const [editing, setEditing] = useState<ListingWithVotes | null>(null);
  const { data, mutate, isLoading } = useSWR<ListingWithVotes[]>(
    "/api/listings",
    jsonFetcher,
  );
  const listings = data ?? [];

  async function handleVote(listingId: number, value: 1 | -1) {
    // gate: opens the profile picker if not signed in, resolves once picked
    const user = await requireUser();
    if (!user) return;

    const optimistic = listings.map((l) =>
      l.id === listingId ? applyVote(l, user, value) : l,
    );
    mutate(optimistic, false);

    await fetch(`/api/listings/${listingId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...userHeaders(user) },
      body: JSON.stringify({ value }),
    });
    mutate(); // revalidate against server truth
  }

  function handleEdit(listing: ListingWithVotes) {
    if (!currentUser?.isAdmin) return;
    setEditing(listing);
  }

  async function handleDelete(listingId: number) {
    if (!currentUser?.isAdmin) return;
    if (!confirm("Delete this listing?")) return;

    mutate(
      listings.filter((l) => l.id !== listingId),
      false,
    );
    await fetch(`/api/listings/${listingId}`, {
      method: "DELETE",
      headers: userHeaders(currentUser),
    });
    mutate();
  }

  return (
    <Container>
      {currentUser && currentUser.isAdmin && (
        <>
          <Stack direction="row" justify="flex-end" style={{ marginBottom: 16 }}>
            <Button small variant="primary" onClick={() => setAddOpen(true)}>
              Add listing
            </Button>
          </Stack>
          <Modal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            title="Add a listing"
          >
            <ListingForm
              currentUser={currentUser}
              onSaved={() => {
                mutate();
                setAddOpen(false);
              }}
            />
          </Modal>
          <Modal
            open={editing !== null}
            onClose={() => setEditing(null)}
            title="Edit listing"
          >
            {editing && (
              // key by id so the form remounts (and re-prefills) per listing
              <ListingForm
                key={editing.id}
                currentUser={currentUser}
                listing={editing}
                onSaved={() => {
                  mutate();
                  setEditing(null);
                }}
              />
            )}
          </Modal>
        </>
      )}

      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading listings…</p>
      ) : listings.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No listings yet
          {currentUser?.isAdmin ? " — add one with the button above." : "."}
        </p>
      ) : (
        <Stack gap={16}>
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              currentUser={currentUser}
              onVote={handleVote}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}
