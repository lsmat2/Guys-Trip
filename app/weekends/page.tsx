"use client";

import useSWR from "swr";
import Container from "@/components/ui/Container";
import WeekendCalendar from "@/components/WeekendCalendar";
import { useAuth } from "@/lib/auth";
import { jsonFetcher, userHeaders } from "@/lib/api";
import type { AvailabilityData } from "@/lib/types";

export default function WeekendsPage() {
  const { currentUser, requireUser } = useAuth();
  const { data, mutate, isLoading } = useSWR<AvailabilityData>(
    "/api/availability",
    jsonFetcher,
  );

  async function handleToggle(weekendStart: string, makeAvailable: boolean) {
    // gate: opens the picker if not signed in
    const user = await requireUser();
    if (!user || !data) return;

    // optimistic update of the availability map for this weekend
    const current = data.available[weekendStart] ?? [];
    const next = makeAvailable
      ? [...current.filter((v) => v.id !== user.id), { id: user.id, name: user.name }]
      : current.filter((v) => v.id !== user.id);

    mutate(
      { ...data, available: { ...data.available, [weekendStart]: next } },
      false,
    );

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...userHeaders(user) },
      body: JSON.stringify({ weekendStart, available: makeAvailable }),
    });
    mutate(); // revalidate
  }

  return (
    <Container>
      <h1>Weekends</h1>

      {isLoading || !data ? (
        <p style={{ color: "var(--text-muted)" }}>Loading weekends…</p>
      ) : (
        <WeekendCalendar
          weekends={data.weekends}
          available={data.available}
          currentUser={currentUser}
          onToggle={handleToggle}
        />
      )}
    </Container>
  );
}
