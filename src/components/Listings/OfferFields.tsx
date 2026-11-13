"use client";
import { useState } from "react";
import { CalendarDays, Clock, PartyPopper, Users, Wrench, Package } from "lucide-react";
import type { Offer, PricingUnit } from "../../services/listing-edit";
import { cn } from "@/lib/utils";
import { Field, controlClass } from "@/components/shell/fields";

const UNITS: { id: PricingUnit; label: string; hint: string; icon: typeof Clock }[] = [
  { id: "EVENT", label: "Per event", hint: "One price for the whole job", icon: PartyPopper },
  { id: "HOUR", label: "Per hour", hint: "e.g. photography, MC", icon: Clock },
  { id: "PERSON", label: "Per guest", hint: "e.g. catering, ushers", icon: Users },
  { id: "DAY", label: "Per day", hint: "e.g. on-site staff", icon: CalendarDays },
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

  return <fieldset className="grid gap-4 rounded-xl border bg-muted/30 p-4" disabled={busy}>
    <legend className="px-1 text-sm font-medium">How you offer it</legend>
    <div role="radiogroup" aria-label="Listing type" className="grid gap-2 sm:grid-cols-2">
      {([["RENTAL", "Rental", "Items people rent", Package], ["SERVICE", "Service", "Work you do at the event", Wrench]] as const).map(([t, title, hint, Icon]) =>
        <label key={t} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 text-sm transition has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
          type === t ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}>
          <input type="radio" name="listingType" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
          <span className={cn("grid size-8 place-items-center rounded-md", type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span>
          <span><span className="block font-medium">{title}</span><span className="block text-xs text-muted-foreground">{hint}</span></span>
        </label>)}
    </div>

    {type === "SERVICE" ? <div role="radiogroup" aria-label="How is it priced?" className="grid gap-2">
      <span className="text-sm font-medium">How is it priced?</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {UNITS.map(u => <label key={u.id} className={cn("flex cursor-pointer flex-col gap-1 rounded-lg border bg-card p-3 text-sm transition has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
          unit === u.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}>
          <input type="radio" name="pricingUnit" value={u.id} checked={unit === u.id} onChange={() => setUnit(u.id)} className="sr-only" />
          <u.icon className={cn("size-4", unit === u.id ? "text-primary" : "text-muted-foreground")} />
          <span className="font-medium">{u.label}</span>
          <span className="text-xs text-muted-foreground">{u.hint}</span>
        </label>)}
      </div>
    </div> : <input type="hidden" name="pricingUnit" value="DAY" />}

    {counts && <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`Minimum ${noun}`}><input className={controlClass} name="minUnits" type="number" min={1} max={10000} step={1} required
        defaultValue={initial?.pricingUnit === effective ? initial.minUnits : 1} /></Field>
      <Field label={<>Maximum {noun} <span className="font-normal text-muted-foreground">(optional)</span></>}><input className={controlClass} name="maxUnits" type="number" min={1} max={10000} step={1}
        defaultValue={initial?.pricingUnit === effective ? initial.maxUnits ?? "" : ""} /></Field>
    </div>}

    <div className="grid gap-3 sm:grid-cols-3">
      <Field label={`Price per ${NOUN[effective]} (ETB)`}><input className={controlClass} name="rate" required inputMode="decimal" placeholder="100.00" defaultValue={price} /></Field>
      <Field label="Security deposit (ETB)" hint={type === "SERVICE" ? "Most services need none." : undefined}>
        <input className={controlClass} name="deposit" required inputMode="decimal" defaultValue={deposit ?? "0.00"} /></Field>
      <Field label={type === "RENTAL" ? "Stock quantity" : "Bookings you can take on the same day"}>
        <input className={controlClass} name="stock" type="number" min={minStock} max={1000000} step={1} required defaultValue={stock ?? 1} /></Field>
    </div>
  </fieldset>;
}
