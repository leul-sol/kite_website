"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, type Dispute } from "@/services/api";
import type { Order } from "@/services/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const CLOSED = ["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED", "EXPIRED"];
const TONE: Record<string, string> = { OPEN: "bg-warning/10 text-warning", RESOLVED: "bg-success/10 text-success" };

export default function DisputesPage() {
  const [orders, setOrders] = useState<Order[]>([]), [booking, setBooking] = useState("");
  const [items, setItems] = useState<Dispute[]>([]), [error, setError] = useState("");
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.getOrders().then(data => { if (active) setOrders(data); }).catch(cause => { if (active) setError((cause as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true; setItems([]);
    if (booking) {
      setLoading(true); setError("");
      api.getDisputes(booking).then(data => { if (active) setItems(data); }).catch(cause => { if (active) setError((cause as Error).message); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [booking]);
  const selected = orders.find(order => order.id === booking);
  const canOpen = selected && !CLOSED.includes(selected.status) && !items.some(item => item.status === "OPEN");

  return <div className="fade-in">
    <PageHeader title="Booking disputes" description="Raise a problem with a booking. An open dispute blocks rental completion while Kite support reviews it." />
    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
      <div className="space-y-3 rounded-xl border bg-card p-5 shadow-xs">
        <Field label="Booking" hint="Pick the booking the problem is about.">
          <select aria-label="Booking" className={controlClass} value={booking} disabled={busy} onChange={event => setBooking(event.target.value)}>
            <option value="">Select a booking</option>
            {orders.map(order => <option key={order.id} value={order.id}>{order.id.slice(0, 8)} · {order.status.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
        </Field>
        {selected && <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-3 text-xs">
          <dt className="text-muted-foreground">Dates</dt><dd className="text-right">{selected.date}</dd>
          <dt className="text-muted-foreground">Total</dt><dd className="text-right font-medium">{selected.total}</dd>
        </dl>}
      </div>

      <div className="space-y-4">
        {error && <FormError>{error}</FormError>}
        {loading && <div role="status" className="space-y-3"><span className="sr-only">Loading disputes...</span><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}
        {!booking && !loading && <EmptyState icon={<ShieldAlert className="size-5" />} title={orders.length ? "Choose a booking" : "No bookings yet"}
          description={orders.length ? "Select a booking to see its disputes or open a new one." : "Disputes can be opened on bookings once customers book you."} />}
        {booking && !loading && !error && <>
          {items.length === 0 && <EmptyState icon={<ShieldCheck className="size-5" />} title="No disputes for this booking." description="Everything is in order." />}
          {items.map(item => <article key={item.id} className="space-y-2 rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">Dispute {item.id.slice(0, 8)}</h2>
              <Badge variant="outline" className={cn("border-transparent", TONE[item.status] ?? "bg-muted text-muted-foreground")}>{item.status.toLowerCase()}</Badge>
            </div>
            <p className="text-sm">{item.reason}</p>
            {item.resolution && <p className="rounded-lg bg-muted/60 p-3 text-sm"><span className="font-medium">Resolution: </span>{item.resolution}</p>}
          </article>)}
          {canOpen && <form className="space-y-3 rounded-xl border bg-card p-5 shadow-xs" onSubmit={async event => {
            event.preventDefault(); if (busy) return;
            const form = event.currentTarget, reason = String(new FormData(form).get("reason")).trim();
            if (!reason) return;
            setBusy(true); setError("");
            try { await api.openDispute(booking, reason); setItems(await api.getDisputes(booking)); form.reset(); toast.success("Dispute opened"); }
            catch (cause) { setError((cause as Error).message); }
            finally { setBusy(false); }
          }}>
            <h2 className="font-medium">Open a dispute</h2>
            <Field label="Reason" hint="Describe what went wrong. Kite support reads this.">
              <textarea required name="reason" maxLength={2000} disabled={busy} className={cn(controlClass, "h-auto min-h-24 py-2")} />
            </Field>
            <div className="flex justify-end"><Button disabled={busy}>{busy ? "Submitting..." : "Open dispute"}</Button></div>
          </form>}
        </>}
      </div>
    </div>
  </div>;
}
