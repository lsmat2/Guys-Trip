"use client";

import { useState } from "react";
import useSWR from "swr";
import Container from "@/components/ui/Container";
import Stack from "@/components/ui/Stack";
import Button from "@/components/ui/Button";
import WeekendCalendar from "@/components/WeekendCalendar";
import CalendarView from "@/components/CalendarView";
import { useAuth } from "@/lib/auth";
import { jsonFetcher, userHeaders } from "@/lib/api";
import type { AvailabilityData } from "@/lib/types";

type View = "calendar" | "list";

export default function WeekendsPage() {
  const { currentUser, requireUser } = useAuth();
  const [view, setView] = useState<View>("calendar");
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
      <Stack direction="row" justify="space-between" align="center">
        <h1 style={{ margin: 0 }}>Weekends</h1>
        <Stack direction="row" gap={4}>
          <Button
            small
            active={view === "calendar"}
            style={{ fontWeight: 600 }}
            onClick={() => setView("calendar")}
          >
            Calendar
          </Button>
          <Button
            small
            active={view === "list"}
            style={{ fontWeight: 600 }}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </Stack>
      </Stack>

      <div style={{ marginTop: "var(--space-5)" }}>
        {isLoading || !data ? (
          <p style={{ color: "var(--text-muted)" }}>Loading weekends…</p>
        ) : view === "calendar" ? (
          <CalendarView
            weekends={data.weekends}
            available={data.available}
            currentUser={currentUser}
            onToggle={handleToggle}
          />
        ) : (
          <WeekendCalendar
            weekends={data.weekends}
            available={data.available}
            currentUser={currentUser}
            onToggle={handleToggle}
          />
        )}
      </div>
    </Container>
  );
}
