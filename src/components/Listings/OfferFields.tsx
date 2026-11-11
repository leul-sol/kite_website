"use client";
import { useState } from "react";
import type { Offer, PricingUnit } from "../../services/listing-edit";
import styles from "./Listings.module.css";

const UNITS: { id: PricingUnit; label: string; hint: string }[] = [
  { id: "EVENT", label: "Per event", hint: "One price for the whole job, e.g. decoration or a DJ" },
  { id: "HOUR", label: "Per hour", hint: "Charged by the hour, e.g. photography or an MC" },
  { id: "PERSON", label: "Per guest", hint: "Charged per guest, e.g. catering or ushers" },
  { id: "DAY", label: "Per day", hint: "Charged for each day of the booking, e.g. on-site staff" },
];
const NOUN: Record<PricingUnit, string> = { DAY: "day", EVENT: "event", HOUR: "hour", PERSON: "guest" };

/**
 * How a listing is offered: a rental (priced per day) or a service priced per
 * event, hour, guest or day. Renders named inputs read with FormData:
 * listingType, pricingUnit, minUnits, maxUnits, rate, deposit and stock.
 */
export default function OfferFields({ initial, busy, price, deposit, stock, minStock = 1 }: {
  initial?: Offer; busy: boolean; price?: string; deposit?: string; stock?: number;
  /** Editing may lower stock to 0 to pause new bookings; creating needs at least 1. */
  minStock?: number;
}) {
  const [type, setType] = useState(initial?.listingType ?? "RENTAL");
  const [unit, setUnit] = useState<PricingUnit>(initial?.listingType === "SERVICE" ? initial.pricingUnit : "EVENT");
  const effective: PricingUnit = type === "RENTAL" ? "DAY" : unit;
  const counts = effective === "HOUR" || effective === "PERSON";
  const noun = effective === "HOUR" ? "hours" : "guests";

  return <fieldset className={styles.offer} disabled={busy}>
    <legend>How you offer it</legend>
    <div className={styles.segmented} role="radiogroup" aria-label="Listing type">
      {(["RENTAL", "SERVICE"] as const).map(t => <label key={t} className={type === t ? styles.segmentOn : ""}>
        <input type="radio" name="listingType" value={t} checked={type === t} onChange={() => setType(t)} />
        {t === "RENTAL" ? "Rental (items people rent)" : "Service (work you do)"}
      </label>)}
    </div>
    {type === "SERVICE" ? <div className={styles.field}>
      <label htmlFor="pricing-unit">How is it priced?</label>
      <select id="pricing-unit" name="pricingUnit" value={unit} onChange={e => setUnit(e.target.value as PricingUnit)}>
        {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
      </select>
      <small className="text-small">{UNITS.find(u => u.id === unit)?.hint}</small>
    </div> : <input type="hidden" name="pricingUnit" value="DAY" />}
    {counts && <div className={styles.unitRange}>
      <label className={styles.field}>Minimum {noun}<input name="minUnits" type="number" min={1} max={10000} step={1} required
        defaultValue={initial?.pricingUnit === effective ? initial.minUnits : 1} /></label>
      <label className={styles.field}>Maximum {noun} <small>(optional)</small><input name="maxUnits" type="number" min={1} max={10000} step={1}
        defaultValue={initial?.pricingUnit === effective ? initial.maxUnits ?? "" : ""} /></label>
    </div>}
    <label className={styles.field}>Price per {NOUN[effective]} (ETB)<input name="rate" required inputMode="decimal" placeholder="100.00" defaultValue={price} /></label>
    <label className={styles.field}>Security deposit (ETB)<input name="deposit" required inputMode="decimal" defaultValue={deposit ?? "0.00"} />
      {type === "SERVICE" && <small className="text-small">Most services need no deposit. Leave it at 0.00 unless you bring equipment.</small>}</label>
    <label className={styles.field}>{type === "RENTAL" ? "Stock quantity" : "Bookings you can take on the same day"}
      <input name="stock" type="number" min={minStock} max={1000000} step={1} required defaultValue={stock ?? 1} /></label>
  </fieldset>;
}
