import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { offerOf, type ListingDetail, type ListingEdit } from "../../services/listing-edit";
import OfferFields from "./OfferFields";
import { Field, controlClass } from "@/components/shell/fields";

export default function ListingEditView({ item, categories, busy, conflict, pending, onSubmit, onConfirm, onBack }: {
  item: ListingDetail; categories: { id: string; name: string }[]; busy: boolean; conflict: boolean;
  pending: ListingEdit | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onConfirm: () => void; onBack: () => void;
}) {
  return <>
    <form onSubmit={onSubmit}>
      <fieldset disabled={busy || conflict || !!pending} className="grid gap-4">
        <Field label="Listing name"><input className={controlClass} name="name" required maxLength={255} defaultValue={item.name} /></Field>
        <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="listing-edit-category">Category</label>
          <select id="listing-edit-category" name="category" defaultValue={item.categoryId} className={controlClass}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="listing-edit-description">Description</label>
          <textarea id="listing-edit-description" name="description" required maxLength={5000} defaultValue={item.description} className={`${controlClass} h-auto min-h-24 py-2`} /></div>
        <OfferFields initial={offerOf(item)} busy={busy || conflict || !!pending}
          price={(item.pricePerDayMinor / 100).toFixed(2)} deposit={(item.securityDepositMinor / 100).toFixed(2)} stock={item.quantityAvailable} minStock={0} />
        <p className="text-xs text-muted-foreground">Stock reductions are checked against existing booking commitments. Booked units cannot be removed.</p>
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm font-medium">
          <span>Active listing<span className="block text-xs font-normal text-muted-foreground">Inactive listings are hidden from customers.</span></span>
          <input name="active" type="checkbox" defaultChecked={item.active} className="size-4 accent-[var(--primary)]" />
        </label>
        <p className="text-xs text-muted-foreground">Price and deposit changes apply to new bookings. Existing bookings keep their recorded amounts.</p>
        <div className="flex justify-end"><Button type="submit">{busy ? "Saving..." : "Save listing"}</Button></div>
      </fieldset>
    </form>
    {pending && <section role="group" aria-label="Confirm listing availability change" className="space-y-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <h3 className="font-medium">{pending.active !== item.active ? (pending.active ? "Activate this listing?" : "Deactivate this listing?") : `Reduce stock to ${pending.quantityAvailable}?`}</h3>
      {pending.active !== item.active && <p className="text-sm text-muted-foreground">{pending.active ? "This listing will be visible for new rentals again." : "This hides the listing and its photos from new discovery. Existing bookings remain in place."}</p>}
      {pending.quantityAvailable < item.quantityAvailable && <p className="text-sm text-muted-foreground">The booking service will verify that {pending.quantityAvailable} units cover all existing commitments before saving.</p>}
      <div className="flex gap-2"><Button type="button" disabled={busy} onClick={onConfirm}>Confirm changes</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={onBack}>Go back</Button></div>
    </section>}
  </>;
}
