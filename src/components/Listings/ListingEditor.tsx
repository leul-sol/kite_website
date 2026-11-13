"use client";
import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../services/api";
import { etbMinor } from "../../services/listing-photos";
import { offerPayload } from "../../services/listing-edit";
import OfferFields from "./OfferFields";
import ListingPhotoManager from "./ListingPhotoManager";
import ListingDialog from "./ListingDialog";
import { Field, FormError, controlClass } from "@/components/shell/fields";

export default function ListingEditor({ onClose, onPublished }: { onClose: () => void; onPublished?: () => void }) {
  const [created, setCreated] = useState<string | null>(null), [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const locked = useRef(false);
  return <ListingDialog label="Create listing" busy={busy || photoBusy} onClose={onClose}>
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">{created ? "Listing created - add photos" : "Create listing"}</h2>
      <p className="text-sm text-muted-foreground">{created ? "Good photos help customers choose you. You can also add them later." : "Create the listing first, then upload photos. You can manage photos later from Listings."}</p>
    </div>
    {created && <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success"><CheckCircle2 className="size-4" />Listing published.</div>}
    {error && <FormError>{error}</FormError>}
    {!created ? <form className="grid gap-4" onSubmit={async event => {
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
        setCreated(item.id); onPublished?.(); toast.success("Listing created");
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Listing could not be created."); }
      finally { locked.current = false; setBusy(false); }
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Listing name"><input className={controlClass} name="name" required maxLength={255} disabled={busy} placeholder="Gold Chiavari chairs" /></Field>
        <Field label="Category"><select className={controlClass} name="category" disabled={busy}>
          <option value="weddings">Weddings</option><option value="birthday">Birthday</option><option value="graduation">Graduation</option><option value="spiritual">Spiritual</option>
        </select></Field>
      </div>
      <Field label="Description"><textarea className={`${controlClass} h-auto min-h-24 py-2`} name="description" required maxLength={5000} disabled={busy}
        placeholder="What's included, sizes, colours and anything customers should know" /></Field>
      <OfferFields busy={busy} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Close</Button>
        <Button type="submit" disabled={busy}>{busy ? "Creating..." : "Create listing"}</Button>
      </div>
    </form> : <>
      <ListingPhotoManager itemId={created} onChanged={onPublished} onBusyChange={setPhotoBusy} />
      <div className="flex justify-end"><Button disabled={photoBusy} onClick={onClose}>Done</Button></div>
    </>}
  </ListingDialog>;
}
