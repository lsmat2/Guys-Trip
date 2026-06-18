"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ListingFacts from "@/components/ListingFacts";
import { userHeaders } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";
import type { ListingWithVotes } from "@/lib/types";
import styles from "./AddListingForm.module.css";

type PreviewFacts = {
  name: string | null;
  summary: string | null;
  rating: number | null;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
};

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
  const [price, setPrice] = useState("");
  const [facts, setFacts] = useState<PreviewFacts | null>(null);
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
      setFacts({
        name: data.name ?? null,
        summary: data.summary ?? null,
        rating: data.rating ?? null,
        bedrooms: data.bedrooms ?? null,
        beds: data.beds ?? null,
        baths: data.baths ?? null,
      });
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
          pricePerNight: price.trim() === "" ? null : Number(price),
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
      setPrice("");
      setFacts(null);
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
        <Input
          style={{ flex: 1 }}
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

      {facts && (facts.name || facts.summary) && (
        <div className={styles.facts}>
          {facts.name && <strong>{facts.name}</strong>}
          <ListingFacts
            summary={facts.summary}
            rating={facts.rating}
            bedrooms={facts.bedrooms}
            beds={facts.beds}
            baths={facts.baths}
            pricePerNight={price.trim() === "" ? null : Number(price)}
          />
        </div>
      )}

      <p className={styles.hint}>
        Name, photo &amp; details auto-fill from the link (the title smush is
        parsed into facts). Edit the raw fields below if the preview is off or
        missing. Price is manual.
      </p>

      <label className={styles.field}>
        <span className={styles.label}>Scraped title (parsed for facts)</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Image URL</span>
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Price / night (optional)</span>
        <Input
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="e.g. 350"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>

      <Button variant="primary" onClick={submit} disabled={submitting}>
        {submitting ? "Adding…" : "Add listing"}
      </Button>
      {error && <p className={styles.error}>{error}</p>}
    </Card>
  );
}
