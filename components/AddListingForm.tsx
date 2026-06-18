"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { userHeaders } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";
import type { ListingWithVotes } from "@/lib/types";
import styles from "./AddListingForm.module.css";

type Props = {
  currentUser: CurrentUser;
  onAdded: (listing: ListingWithVotes) => void;
};

/**
 * Admin-only add form. Flow: paste URL → "Preview" auto-fills title/image via
 * the OG scraper → fields stay editable so the admin can fix or supply them
 * manually (the Airbnb-blocks-bots fallback) → "Add".
 */
export default function AddListingForm({ currentUser, onAdded }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function preview() {
    if (!url.trim()) {
      setError("Paste a URL first.");
      return;
    }
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not fetch preview.");
        return;
      }
      setTitle(data.title ?? "");
      setImageUrl(data.image ?? "");
      setDescription(data.description ?? "");
      if (!data.title && !data.image) {
        setError("No preview found (site may block it) — fill in title/image manually.");
      }
    } catch {
      setError("Network error fetching preview.");
    } finally {
      setPreviewing(false);
    }
  }

  async function submit() {
    if (!url.trim()) {
      setError("Paste a URL first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeaders(currentUser) },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not add listing.");
        return;
      }
      // reset and notify parent to revalidate
      setUrl("");
      setTitle("");
      setImageUrl("");
      setDescription("");
      onAdded(data as ListingWithVotes);
    } catch {
      setError("Network error adding listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={styles.form}>
      <h2 className={styles.heading}>Add a listing</h2>
      <div className={styles.row}>
        <input
          className={`${styles.input} ${styles.flex1}`}
          placeholder="Paste an Airbnb (or any) link…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button onClick={preview} disabled={previewing}>
          {previewing ? "…" : "Preview"}
        </Button>
      </div>

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className={styles.previewImg} />
      )}

      <p className={styles.hint}>
        Title &amp; image auto-fill from the link. Edit them if the preview is off
        or missing.
      </p>

      <label className={styles.field}>
        <span className={styles.label}>Title</span>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Image URL</span>
        <input
          className={styles.input}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </label>

      <Button variant="primary" onClick={submit} disabled={submitting}>
        {submitting ? "Adding…" : "Add listing"}
      </Button>
      {error && <p className={styles.error}>{error}</p>}
    </Card>
  );
}
