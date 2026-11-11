"use client";
import { useRef, useState } from "react";
import { api } from "../../services/api";
import { etbMinor } from "../../services/listing-photos";
import { offerPayload } from "../../services/listing-edit";
import OfferFields from "./OfferFields";
import ListingPhotoManager from "./ListingPhotoManager";
import ListingDialog from "./ListingDialog";
import styles from "./Listings.module.css";

export default function ListingEditor({ onClose, onPublished }: { onClose: () => void; onPublished?: () => void }) {
  const [created, setCreated] = useState<string | null>(null), [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const locked = useRef(false);
  return <ListingDialog label="Create listing" busy={busy || photoBusy} onClose={onClose}>
      <h2>{created ? "Listing created - add photos" : "Create listing"}</h2>
      {error && <p role="alert">{error}</p>}
      {!created ? <form onSubmit={async event => {
        event.preventDefault(); if (locked.current) return;
        const form = new FormData(event.currentTarget); setError("");
        try {
          const pricePerDayMinor = etbMinor(String(form.get("rate")));
          const quantityAvailable = Number(form.get("stock"));
          const securityDepositMinor = etbMinor(String(form.get("deposit")), true);
          if (!Number.isSafeInteger(quantityAvailable) || quantityAvailable < 1) throw new Error("Enter a whole stock quantity of at least one.");
          const offer = offerPayload(form);
          locked.current = true; setBusy(true);
          const item = await api.createListing({ name: String(form.get("name")).trim(), categoryId: String(form.get("category")),
            description: String(form.get("description")).trim(), pricePerDayMinor, quantityAvailable, securityDepositMinor, ...offer });
          setCreated(item.id); onPublished?.();
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Listing could not be created."); }
        finally { locked.current = false; setBusy(false); }
      }}>
        <label className={styles.field}>Listing name<input name="name" required maxLength={255} disabled={busy} /></label>
        <label className={styles.field}>Category<select name="category" disabled={busy}>
          <option value="weddings">Weddings</option><option value="birthday">Birthday</option><option value="graduation">Graduation</option><option value="spiritual">Spiritual</option>
        </select></label>
        <label className={styles.field}>Description<textarea name="description" required maxLength={5000} disabled={busy} /></label>
        <OfferFields busy={busy} />
        <p>Create the listing first, then upload photos. You can manage photos later from Inventory.</p>
        <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Creating..." : "Create listing"}</button>
      </form> : <ListingPhotoManager itemId={created} onChanged={onPublished} onBusyChange={setPhotoBusy} />}
      <button className="btn-secondary" type="button" disabled={busy || photoBusy} onClick={onClose}>{created ? "Done" : "Close"}</button>
  </ListingDialog>;
}
