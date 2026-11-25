import { Inbox, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { orderColumns, orderColumn, orderActions, type Order, type OrderTarget, type ChangeRequest } from "../../services/orders";
import type { StaffMember } from "@/services/api";
import OrderCard from "./OrderCard";
import { useT } from "@/i18n/I18nProvider";

const panel = "space-y-3 rounded-xl border p-4 shadow-xs";

export default function OrderBoardView(props: {
  orders: Order[]; loading: boolean; error: string; busy: boolean; refresh: () => void;
  onAction: (order: Order, target: OrderTarget) => void; onReview: (order: Order) => void;
  pending: { order: Order; target: OrderTarget } | null;
  review: { order: Order; changes: ChangeRequest[] } | null;
  note: string; onNote: (value: string) => void; onClose: () => void;
  onConfirm: () => void; onResolve: (id: string, approved: boolean) => void;
  staffFor?: (orderId: string) => StaffMember[] | undefined; onAssign?: (order: Order) => void; onHandover?: (order: Order) => void;
  highlighted?: string | null;
}) {
  const { t } = useT();
  const disabled = props.busy || props.loading;
  const columns = orderColumns.filter(column => column.id !== "other" || props.orders.some(order => orderColumn(order.status) === "other"));
  return <section aria-label={t("ord.boardLabel")} aria-busy={disabled} className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs">
      <p>{t("ord.intro")}</p>
      <Button type="button" variant="outline" size="sm" disabled={disabled || !!props.pending || !!props.review} onClick={props.refresh}>
        <RefreshCw className={cn("size-3.5", props.loading && "animate-spin")} />{t("ord.refresh")}</Button>
    </div>
    {props.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{props.error}</p>}
    {props.loading && <p role="status" className="sr-only">{t("ord.loading")}</p>}
    {props.busy && <p role="status" className="text-sm text-muted-foreground">{t("ord.processing")}</p>}

    {props.pending && <section className={cn(panel, "border-primary/40 bg-primary/5")} aria-label={t("ord.confirmLabel")}>
      <h3 className="font-semibold">{orderActions(props.pending.order.status).some(a => a.target === props.pending?.target) && t(`ord.act.${props.pending.target}`)}</h3>
      <p className="text-sm text-muted-foreground">{t("ord.changesBoth", { id: props.pending.order.id })}</p>
      {props.pending.target === "CANCELLED" && <p className="text-sm">{t("ord.cancelNote")}</p>}
      {props.pending.target === "COMPLETED" && <p className="text-sm">{t("ord.completeNote")}</p>}
      <div className="flex gap-2">
        <Button disabled={disabled} onClick={props.onConfirm}>{t("ord.confirmAction")}</Button>
        <Button variant="outline" disabled={disabled} onClick={props.onClose}>{t("common.goBack")}</Button>
      </div>
    </section>}

    {props.review && <section className={cn(panel, "border-warning/40 bg-warning/5")} aria-label={t("ord.reviewLabel")}>
      <h3 className="font-semibold">{t("ord.changesFor", { ref: props.review.order.id.slice(0, 8) })}</h3>
      <p className="text-sm text-muted-foreground">{t("ord.currentDates", { dates: props.review.order.date })}</p>
      {props.review.changes.length === 0 && <p className="text-sm">{t("ord.noOpen")}</p>}
      {props.review.changes.length > 0 && <label className="grid gap-1.5 text-sm font-medium">{t("ord.decisionNote")}
        <textarea className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm font-normal shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" maxLength={1000} value={props.note} disabled={disabled} onChange={event => props.onNote(event.target.value)} />
      </label>}
      {props.review.changes.map(change => <div key={change.id} className="space-y-1.5 rounded-lg border bg-card p-3 text-sm">
        <p className="flex items-center gap-2 font-medium">{t("ord.request")} <Badge variant="secondary">{change.request_type === "RESCHEDULE" ? t("ord.req.RESCHEDULE") : t("ord.req.CANCELLATION")}</Badge></p>
        <p className="text-muted-foreground">{t("ord.reason", { reason: change.reason || t("ord.noReason") })}</p>
        {change.request_type === "RESCHEDULE" && <p>{t("ord.requestedDates", { dates: `${change.requested_start_date} - ${change.requested_end_date}` })}</p>}
        {change.request_type === "CANCELLATION" && <p className="text-muted-foreground">{t("ord.cancelRefund")}</p>}
        {change.requested_role === "PROVIDER" ? <p className="text-muted-foreground">{t("ord.awaitingCustomer")}</p> : <div className="flex gap-2 pt-1">
          <Button size="sm" disabled={disabled} onClick={() => props.onResolve(change.id, true)}>{t("ord.approve")}</Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => props.onResolve(change.id, false)}>{t("ord.decline")}</Button>
        </div>}
      </div>)}
      <Button variant="ghost" size="sm" disabled={disabled} onClick={props.onClose}>{t("ord.closeReview")}</Button>
    </section>}

    {!props.loading && !props.error && props.orders.length === 0 && <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><Inbox className="size-5" /></div>
      <p className="font-medium">{t("ord.none")}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("ord.noneText")}</p>
    </div>}

    {props.loading && <div className="flex gap-4 overflow-x-auto pb-2">{[0, 1, 2, 3].map(i => <div key={i} className="w-72 shrink-0 space-y-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-36 w-full" /></div>)}</div>}

    {!props.loading && props.orders.length > 0 && <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map(column => {
        const orders = props.orders.filter(order => orderColumn(order.status) === column.id);
        return <section key={column.id} aria-label={t(column.key)} className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{t(column.key)}</h3>
            <Badge variant="secondary" className="tabular-nums">{orders.length}</Badge>
          </div>
          <div className="flex-1 space-y-3">
            {orders.length === 0 && <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">{t("ord.nothingHere")}</p>}
            {orders.map(order => <OrderCard key={order.id} order={order} highlighted={props.highlighted === order.id} busy={disabled || !!props.pending || !!props.review}
              onAction={props.onAction} onReview={props.onReview} staff={props.staffFor?.(order.id)} onAssign={props.onAssign} onHandover={props.onHandover} />)}
          </div>
        </section>;
      })}
    </div>}
  </section>;
}
