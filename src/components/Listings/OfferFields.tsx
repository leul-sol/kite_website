"use client";
import { useState } from "react";
import { CalendarDays, Clock, PartyPopper, Users, Wrench, Package } from "lucide-react";
import type { Offer, PricingUnit } from "../../services/listing-edit";
import { cn } from "@/lib/utils";
import { Field, controlClass } from "@/components/shell/fields";
import { useT } from "@/i18n/I18nProvider";

const UNITS = [
  { id: "EVENT", label: "offer.perEvent", hint: "offer.perEventHint", icon: PartyPopper },
  { id: "HOUR", label: "offer.perHour", hint: "offer.perHourHint", icon: Clock },
  { id: "PERSON", label: "offer.perGuest", hint: "offer.perGuestHint", icon: Users },
  { id: "DAY", label: "offer.perDay", hint: "offer.perDayHint", icon: CalendarDays },
] as const;
const NOUN = { DAY: "unit.day", EVENT: "unit.event", HOUR: "unit.hour", PERSON: "unit.guest" } as const;

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
  const { t } = useT();
  const [type, setType] = useState(initial?.listingType ?? "RENTAL");
  const [unit, setUnit] = useState<PricingUnit>(initial?.listingType === "SERVICE" ? initial.pricingUnit : "EVENT");
  const effective: PricingUnit = type === "RENTAL" ? "DAY" : unit;
  const counts = effective === "HOUR" || effective === "PERSON";
  const hours = effective === "HOUR";

  return <fieldset className="grid gap-4 rounded-xl border bg-muted/30 p-4" disabled={busy}>
    <legend className="px-1 text-sm font-medium">{t("offer.legend")}</legend>
    <div role="radiogroup" aria-label={t("offer.typeLabel")} className="grid gap-2 sm:grid-cols-2">
      {([["RENTAL", t("lst.rental"), t("offer.rentalHint"), Package], ["SERVICE", t("lst.service"), t("offer.serviceHint"), Wrench]] as const).map(([kind, title, hint, Icon]) =>
        <label key={kind} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 text-sm transition has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
          type === kind ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}>
          <input type="radio" name="listingType" value={kind} checked={type === kind} onChange={() => setType(kind)} className="sr-only" />
          <span className={cn("grid size-8 place-items-center rounded-md", type === kind ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span>
          <span><span className="block font-medium">{title}</span><span className="block text-xs text-muted-foreground">{hint}</span></span>
        </label>)}
    </div>

    {type === "SERVICE" ? <div role="radiogroup" aria-label={t("offer.priced")} className="grid gap-2">
      <span className="text-sm font-medium">{t("offer.priced")}</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {UNITS.map(u => <label key={u.id} className={cn("flex cursor-pointer flex-col gap-1 rounded-lg border bg-card p-3 text-sm transition has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
          unit === u.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}>
          <input type="radio" name="pricingUnit" value={u.id} checked={unit === u.id} onChange={() => setUnit(u.id)} className="sr-only" />
          <u.icon className={cn("size-4", unit === u.id ? "text-primary" : "text-muted-foreground")} />
          <span className="font-medium">{t(u.label)}</span>
          <span className="text-xs text-muted-foreground">{t(u.hint)}</span>
        </label>)}
      </div>
    </div> : <input type="hidden" name="pricingUnit" value="DAY" />}

    {counts && <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t(hours ? "offer.minHours" : "offer.minGuests")}><input className={controlClass} name="minUnits" type="number" min={1} max={10000} step={1} required
        defaultValue={initial?.pricingUnit === effective ? initial.minUnits : 1} /></Field>
      <Field label={<>{t(hours ? "offer.maxHours" : "offer.maxGuests")} <span className="font-normal text-muted-foreground">{t("common.optionalTag")}</span></>}><input className={controlClass} name="maxUnits" type="number" min={1} max={10000} step={1}
        defaultValue={initial?.pricingUnit === effective ? initial.maxUnits ?? "" : ""} /></Field>
    </div>}

    <div className="grid gap-3 sm:grid-cols-3">
      <Field label={t("offer.price", { unit: t(NOUN[effective]) })}><input className={controlClass} name="rate" required inputMode="decimal" placeholder="100.00" defaultValue={price} /></Field>
      <Field label={t("offer.deposit")} hint={type === "SERVICE" ? t("offer.depositHint") : undefined}>
        <input className={controlClass} name="deposit" required inputMode="decimal" defaultValue={deposit ?? "0.00"} /></Field>
      <Field label={type === "RENTAL" ? t("offer.stock") : t("offer.capacity")}>
        <input className={controlClass} name="stock" type="number" min={minStock} max={1000000} step={1} required defaultValue={stock ?? 1} /></Field>
    </div>
  </fieldset>;
}
