import type { FormEvent } from "react";
import type { ListingDetail, ListingEdit } from "../../services/listing-edit";
import styles from "./Listings.module.css";

export default function ListingEditView({ item, categories, busy, conflict, pending, onSubmit, onConfirm, onBack }: {
  item: ListingDetail; categories: { id: string; name: string }[]; busy: boolean; conflict: boolean;
  pending: ListingEdit | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onConfirm: () => void; onBack: () => void;
}) {
  return <>
    <form onSubmit={onSubmit}>
      <fieldset disabled={busy || conflict || !!pending} className={styles.editFields}>
        <label className={styles.field}>Listing name<input name="name" required maxLength={255} defaultValue={item.name} /></label>
        <div className={styles.field}><label htmlFor="listing-edit-category">Category</label><select id="listing-edit-category" name="category" defaultValue={item.categoryId}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="listing-edit-description">Description</label><textarea id="listing-edit-description" name="description" required maxLength={5000} defaultValue={item.description} /></div>
        <label className={styles.field}>Daily rate (ETB)<input name="rate" required inputMode="decimal" defaultValue={(item.pricePerDayMinor / 100).toFixed(2)} /></label>
        <label className={styles.field}>Security deposit (ETB)<input name="deposit" required inputMode="decimal" defaultValue={(item.securityDepositMinor / 100).toFixed(2)} /></label>
        <label className={styles.field}>Stock quantity<input name="stock" type="number" required min={0} max={1000000} step={1} defaultValue={item.quantityAvailable} /></label>
        <p>Stock reductions are checked against existing booking commitments. Booked units cannot be removed.</p>
        <label className={styles.field}><span>Active listing</span><input name="active" type="checkbox" defaultChecked={item.active} /></label>
        <p>Price and deposit changes apply to new bookings. Existing bookings keep their recorded amounts.</p>
        <button className="btn-primary" type="submit">{busy ? "Saving..." : "Save listing"}</button>
      </fieldset>
    </form>
    {pending && <section role="group" aria-label="Confirm listing availability change">
      <h3>{pending.active !== item.active ? (pending.active ? "Activate this listing?" : "Deactivate this listing?") : `Reduce stock to ${pending.quantityAvailable}?`}</h3>
      {pending.active !== item.active && <p>{pending.active ? "This listing will be visible for new rentals again." : "This hides the listing and its photos from new discovery. Existing bookings remain in place."}</p>}
      {pending.quantityAvailable < item.quantityAvailable && <p>The booking service will verify that {pending.quantityAvailable} units cover all existing commitments before saving.</p>}
      <button type="button" className="btn-primary" disabled={busy} onClick={onConfirm}>Confirm changes</button>
      <button type="button" className="btn-secondary" disabled={busy} onClick={onBack}>Go back</button>
    </section>}
  </>;
}
