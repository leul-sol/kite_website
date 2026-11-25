"use client";
import { CalendarDays, ClipboardCheck, User, UserPlus } from "lucide-react";
import type { StaffMember } from "@/services/api";
import { canAssignStaff } from "@/services/staff";
import StaffAvatar from "@/components/Staff/StaffAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isChangeRequest, orderActions, type Order, type OrderTarget } from "../../services/orders";
import { useT } from "@/i18n/I18nProvider";
import { useStatusLabel } from "@/i18n/labels";

/** Check-out / check-in notes make sense once a booking is confirmed. */
export const HANDOVER_STATUSES = ["CONFIRMED", "PICKED_UP", "ACTIVE", "COMPLETED"];

export const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-muted text-muted-foreground", PAID: "bg-primary/10 text-primary", CONFIRMED: "bg-primary/10 text-primary",
  ACTIVE: "bg-success/10 text-success", PICKED_UP: "bg-success/10 text-success", COMPLETED: "bg-success/10 text-success",
  CANCELLATION_REQUESTED: "bg-warning/10 text-warning", RESCHEDULE_REQUESTED: "bg-warning/10 text-warning",
};

export default function OrderCard({ order, busy, onAction, onReview, staff, onAssign, onHandover, highlighted }: {
  order: Order; busy: boolean;
  onAction: (order: Order, target: OrderTarget) => void;
  onReview: (order: Order) => void;
  /** People assigned to this booking; undefined when the schedule is not loaded. */
  staff?: StaffMember[];
  onAssign?: (order: Order) => void;
  onHandover?: (order: Order) => void;
  /** Opened from a notification about this booking. */
  highlighted?: boolean;
}) {
  const actions = orderActions(order.status);
  const { t, locale, money } = useT();
  const statusLabel = useStatusLabel();
  return <article id={`order-${order.id}`} aria-current={highlighted ? "true" : undefined}
    className={cn("space-y-3 rounded-xl border bg-card p-4 shadow-xs transition hover:shadow-sm", highlighted && "ring-2 ring-primary")}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h4 className="font-medium">{t("booking.ref", { ref: order.id.slice(0, 8) })}</h4>
        <p className="truncate text-[11px] text-muted-foreground" title={order.id}>{t("ord.reference", { id: order.id })}</p>
      </div>
      <Badge variant="outline" className={cn("shrink-0 border-transparent text-[10px] uppercase", STATUS_STYLE[order.status] ?? "bg-muted text-muted-foreground")}>
        {locale === "en" ? order.status.replaceAll("_", " ").toLowerCase() : statusLabel(order.status)}
      </Badge>
    </div>
    <div className="space-y-1.5 text-sm text-muted-foreground">
      <p className="flex items-center gap-2"><CalendarDays className="size-3.5" />{order.date}</p>
      <p className="flex items-center gap-2"><User className="size-3.5" />{t("ord.customerRef", { ref: order.customerId.slice(0, 8) })}</p>
    </div>
    {onAssign && canAssignStaff(order.status) && <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
      {staff && staff.length > 0
        ? <div className="flex -space-x-1.5" aria-label={t("ord.staffList", { names: staff.map(m => m.name).join(", ") })}>{staff.slice(0, 4).map(m => <StaffAvatar key={m.id} member={m} className="size-6 border-2 border-card text-[9px]" />)}
            {staff.length > 4 && <span className="grid size-6 place-items-center rounded-full border-2 border-card bg-muted text-[9px]">+{staff.length - 4}</span>}</div>
        : <span className="text-xs text-muted-foreground">{t("ord.noStaff")}</span>}
      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy} onClick={() => onAssign(order)}>
        <UserPlus className="size-3.5" />{staff && staff.length ? t("ord.changeStaff") : t("ord.assignStaff")}</Button>
    </div>}
    {onHandover && HANDOVER_STATUSES.includes(order.status) && <Button type="button" size="sm" variant="ghost" className="h-7 w-full justify-start px-2 text-xs text-muted-foreground"
      onClick={() => onHandover(order)}><ClipboardCheck className="size-3.5" />{t("ho.title")}</Button>}
    <div className="flex items-center justify-between border-t pt-3">
      <span className="text-xs text-muted-foreground">{t("ord.total")}</span>
      <strong className="tabular-nums">{locale === "en" || order.totalMinor === undefined ? order.total : money(order.totalMinor, order.currency)}</strong>
    </div>
    {(actions.length > 0 || isChangeRequest(order.status)) && <div className="flex flex-wrap gap-2">
      {actions.map(action => <Button type="button" key={action.target} size="sm"
        variant={action.target === "CANCELLED" || action.target === "REJECTED" ? "outline" : "default"}
        className="flex-1" disabled={busy} onClick={() => onAction(order, action.target)}>{t(`ord.act.${action.target}`)}</Button>)}
      {isChangeRequest(order.status) && <Button type="button" size="sm" variant="secondary" className="flex-1" disabled={busy}
        onClick={() => onReview(order)}>{t("ord.review")}</Button>}
    </div>}
  </article>;
}
