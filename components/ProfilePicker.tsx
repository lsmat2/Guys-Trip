"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth, type CurrentUser } from "@/lib/auth";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./ProfilePicker.module.css";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Global "who are you?" modal. Mounted once in providers; visibility is driven
 * by auth context (opened on demand by requireUser() or the header button).
 */
export default function ProfilePicker() {
  const { pickerOpen, closePicker, signIn } = useAuth();
  const { mutate } = useSWRConfig();
  const { data: users, isLoading } = useSWR<CurrentUser[]>(
    pickerOpen ? "/api/users" : null,
    fetcher,
  );

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function pick(user: CurrentUser) {
    signIn(user);
    setName("");
    setError(null);
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a name first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not create profile.");
        return;
      }
      // refresh the cached user list so the new name appears next time
      mutate("/api/users");
      pick(data as CurrentUser);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={pickerOpen} title="Who are you?" onClose={closePicker}>
      <p className={styles.intro}>
        Pick your profile to vote and set your availability. No password — just
        tap your name (or add yourself).
      </p>

      {isLoading ? (
        <p className={styles.empty}>Loading profiles…</p>
      ) : users && users.length > 0 ? (
        <div className={styles.grid}>
          {users.map((u) => (
            <button key={u.id} className={styles.profile} onClick={() => pick(u)}>
              <span className={styles.avatar}>{u.name.charAt(0)}</span>
              <span className={styles.name}>{u.name}</span>
              {u.isAdmin && <span className={styles.adminTag}>admin</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No profiles yet — be the first.</p>
      )}

      <hr className={styles.divider} />

      <label className={styles.label} htmlFor="new-profile">
        New here? Add your name
      </label>
      <div className={styles.createRow}>
        <input
          id="new-profile"
          className={styles.input}
          value={name}
          maxLength={40}
          placeholder="e.g. Jake"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          disabled={submitting}
        />
        <Button variant="primary" onClick={create} disabled={submitting}>
          {submitting ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );
}
