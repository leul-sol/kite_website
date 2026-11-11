"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Boxes, ImageIcon, RefreshCw, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api, type InventoryIssue, type InventoryItem, type InventoryView, type ItemUsage, type Listing } from "@/services/api";
import { addDays, shortDay, today } from "@/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { FormError } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import ReportIssueDialog, { ISSUE_KINDS } from "@/components/Inventory/ReportIssueDialog";

const KIND_LABEL = Object.fromEntries(ISSUE_KINDS.map(k => [k.id, k.label]));
const KIND_TONE: Record<string, string> = { DAMAGED: "bg-destructive/10 text-destructive", IN_REPAIR: "bg-warning/10 text-warning", LOST: "bg-muted text-muted-foreground" };

export default function InventoryPage() {
  const [data, setData] = useState<InventoryView>(), [photos, setPhotos] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [reporting, setReporting] = useState<string | null | undefined>(undefined);
  const [usage, setUsage] = useState<InventoryItem | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await api.getInventory()); } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); api.getListings().then(rows => setPhotos(Object.fromEntries(rows.map(r => [r.id, r])))).catch(() => undefined); }, [load]);

  const open = useMemo(() => data?.issues.filter(i => i.status === "OPEN") ?? [], [data]);
  const resolved = useMemo(() => data?.issues.filter(i => i.status !== "OPEN") ?? [], [data]);
  const name = (id: string) => data?.items.find(i => i.id === id)?.name ?? "Listing";
  const totals = data?.items.reduce((t, i) => ({ stock: t.stock + i.stock, out: t.out + i.outOfService }), { stock: 0, out: 0 });

  async function resolve(issue: InventoryIssue, outcome: "RETURNED" | "WRITTEN_OFF") {
    setResolving(issue.id); setError("");
    try {
      await api.resolveInventoryIssue(issue.id, outcome);
      toast.success(outcome === "RETURNED" ? `${issue.quantity} back in stock and bookable again` : `${issue.quantity} written off and removed from stock`);
      await load();
    } catch (cause) { setError((cause as Error).message); } finally { setResolving(null); }
  }

  return <div className="fade-in space-y-6">
    <PageHeader title="Inventory" description="Keep stock honest: take damaged, in-repair or lost units out of service so customers can't book them."
      actions={<>
        <Button variant="outline" size="icon" aria-label="Refresh inventory" disabled={loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>
        <Button disabled={!data?.items.length} onClick={() => setReporting(null)}><Wrench className="size-4" />Report issue</Button>
      </>} />
    {error && <FormError>{error}</FormError>}
    {loading && !data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>}

    {data && data.items.length === 0 && <EmptyState icon={<Boxes className="size-5" />} title="No rental listings yet"
      description="Inventory tracks things you rent out. Service listings don't need it."
      action={<Button asChild><Link href="/listings">Go to Listings</Link></Button>} />}

    {data && data.items.length > 0 && totals && <div className="grid gap-4 sm:grid-cols-3">
      <Figure label="Units owned" value={totals.stock} />
      <Figure label="Out of service" value={totals.out} tone={totals.out ? "warning" : undefined} />
      <Figure label="Bookable now" value={totals.stock - totals.out} tone="success" />
    </div>}

    {open.length > 0 && <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-warning" />Out of service</h2>
      <ul className="divide-y rounded-xl border bg-card shadow-xs">
        {open.map(issue => <li key={issue.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Badge variant="outline" className={cn("border-transparent", KIND_TONE[issue.kind])}>{KIND_LABEL[issue.kind]}</Badge>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{issue.quantity} × {name(issue.itemId)}</p>
            <p className="truncate text-xs text-muted-foreground">Reported {new Date(issue.reportedAt).toLocaleDateString()}{issue.bookingId && ` · after booking ${issue.bookingId.slice(0, 8)}`}{issue.note && ` · ${issue.note}`}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={resolving === issue.id} onClick={() => void resolve(issue, "RETURNED")}>Back in stock</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={resolving === issue.id}
              onClick={() => { if (confirm(`Write off ${issue.quantity} × ${name(issue.itemId)}? Your stock goes down by ${issue.quantity}.`)) void resolve(issue, "WRITTEN_OFF"); }}>Write off</Button>
          </div>
        </li>)}
      </ul>
    </section>}

    {data && data.items.length > 0 && <section className="space-y-3">
      <h2 className="font-semibold">Rental stock</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map(item => {
          const bookable = item.stock - item.outOfService, pct = item.stock ? (bookable / item.stock) * 100 : 0, listing = photos[item.id];
          return <li key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                {listing?.image && item.active ? <img src={listing.image} alt="" className="size-full object-cover" /> : <ImageIcon className="size-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.active ? "Active" : "Inactive"} listing</p>
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm"><span><strong className="tabular-nums">{bookable}</strong> <span className="text-muted-foreground">of {item.stock} bookable</span></span>
                {item.outOfService > 0 && <span className="text-xs font-medium text-warning">{item.outOfService} out</span>}</div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", item.outOfService ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="mt-auto flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setUsage(item)}><BarChart3 className="size-3.5" />Next 30 days</Button>
              <Button size="sm" variant="outline" className="flex-1" disabled={bookable < 1} onClick={() => setReporting(item.id)}><Wrench className="size-3.5" />Report issue</Button>
            </div>
          </li>;
        })}
      </ul>
    </section>}

    {resolved.length > 0 && <details className="rounded-xl border bg-card shadow-xs">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Resolved in the last 90 days ({resolved.length})</summary>
      <ul className="divide-y border-t">{resolved.map(issue => <li key={issue.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <span>{issue.quantity} × {name(issue.itemId)} <span className="text-muted-foreground">· {KIND_LABEL[issue.kind].toLowerCase()}</span></span>
        <span className="text-xs text-muted-foreground">{issue.status === "RETURNED" ? "Back in stock" : "Written off"} {issue.resolvedAt && new Date(issue.resolvedAt).toLocaleDateString()}</span>
      </li>)}</ul>
    </details>}

    {reporting !== undefined && data && <ReportIssueDialog items={data.items.filter(i => i.stock - i.outOfService > 0)} itemId={reporting ?? undefined}
      onClose={() => setReporting(undefined)} onSaved={() => void load()} />}
    {usage && <UsageDialog item={usage} onClose={() => setUsage(null)} />}
  </div>;
}

function Figure({ label, value, tone }: { label: string; value: number; tone?: "warning" | "success" }) {
  return <div className="rounded-xl border bg-card p-4 shadow-xs">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "warning" && "text-warning", tone === "success" && "text-success")}>{value.toLocaleString()}</p>
  </div>;
}

/** How many units are booked on each of the next 30 days against what is bookable. */
function UsageDialog({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [usage, setUsage] = useState<ItemUsage>(), [error, setError] = useState("");
  useEffect(() => {
    const from = today();
    api.getItemUsage(item.id, from, addDays(from, 29)).then(setUsage).catch(cause => setError((cause as Error).message));
  }, [item.id]);
  const bookable = item.stock - item.outOfService;
  const peak = usage ? Math.max(bookable, ...usage.days.map(d => d.reserved), 1) : 1;
  const busiest = usage?.days.reduce((max, d) => d.reserved > max.reserved ? d : max, { date: "", reserved: 0 });

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{item.name}</DialogTitle><DialogDescription>Units booked each day for the next 30 days. {bookable} bookable.</DialogDescription></DialogHeader>
      {error && <FormError>{error}</FormError>}
      {!usage && !error && <Skeleton className="h-40" />}
      {usage && <>
        <div className="relative">
          <div className="absolute inset-x-0 border-t border-dashed border-primary/60" style={{ bottom: `${(bookable / peak) * 100}%` }}>
            <span className="absolute -top-4 right-0 text-[10px] font-medium text-primary">{bookable} bookable</span>
          </div>
          <div role="img" aria-label={`Units booked per day for ${item.name}`} className="flex h-40 items-end gap-[3px]">
            {usage.days.map(day => <div key={day.date} title={`${shortDay(day.date)}: ${day.reserved} booked`}
              className={cn("flex-1 rounded-t-sm", day.reserved > bookable ? "bg-destructive" : day.reserved ? "bg-primary/80" : "bg-muted")}
              style={{ height: `${Math.max(2, (day.reserved / peak) * 100)}%` }} />)}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground"><span>{shortDay(usage.from)}</span><span>{shortDay(usage.to)}</span></div>
        <p className="text-sm">{busiest && busiest.reserved > 0 ? <>Busiest day: <strong>{shortDay(busiest.date)}</strong>, {busiest.reserved} of {bookable} booked.</> : "No bookings in the next 30 days."}</p>
        {usage.bookings.length > 0 && <ul className="max-h-40 divide-y overflow-y-auto rounded-lg border text-sm">
          {usage.bookings.map(b => <li key={b.id} className="flex justify-between gap-2 px-3 py-2">
            <span>Booking {b.id.slice(0, 8)} · {b.startDate === b.endDate ? shortDay(b.startDate) : `${shortDay(b.startDate)} – ${shortDay(b.endDate)}`}</span>
            <span className="font-medium tabular-nums">{b.quantity} units</span>
          </li>)}
        </ul>}
      </>}
    </DialogContent>
  </Dialog>;
}
