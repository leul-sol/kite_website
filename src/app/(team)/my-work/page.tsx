"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarOff, ClipboardCheck, Package, RefreshCw } from "lucide-react";
import { api, type TeamSchedule } from "@/services/api";
import { addDays, shortDay, today } from "@/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shell/PageHeader";
import { FormError } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import HandoverDialog from "@/components/Inventory/HandoverDialog";
import StaffAvatar from "@/components/Staff/StaffAvatar";

const HANDOVER = ["CONFIRMED", "PICKED_UP", "ACTIVE", "COMPLETED"];
const when = (start: string, end: string) => start === end ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`;

/** A team member's own bookings for the next four weeks. No payments or customer details. */
export default function MyWorkPage() {
  const [data, setData] = useState<TeamSchedule>(), [error, setError] = useState(""), [loading, setLoading] = useState(true);
  const [names, setNames] = useState<Record<string, string>>({});
  const [handover, setHandover] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const from = today(), schedule = await api.getMyWork(from, addDays(from, 27));
      setData(schedule);
      const ids = Array.from(new Set(schedule.bookings.flatMap(b => b.items.map(i => i.itemId))));
      const pairs = await Promise.all(ids.map(async id => [id, await api.getItemName(id).catch(() => "Listing")] as const));
      setNames(Object.fromEntries(pairs));
    } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const me = data?.team.find(m => m.id === data.memberId);
  const next = useMemo(() => data?.bookings.find(b => b.endDate >= today()), [data]);

  return <div className="fade-in space-y-6">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{me ? `Hi ${me.name.split(" ")[0]}` : "My work"}</h1>
        <p className="text-sm text-muted-foreground">Bookings you are working on in the next 4 weeks.</p>
      </div>
      <Button variant="outline" size="icon" aria-label="Refresh" disabled={loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>
    </div>
    {error && <FormError>{error}</FormError>}
    {loading && !data && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}

    {next && <div className="flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground">
      <CalendarCheck className="size-6 shrink-0" />
      <div><p className="text-sm opacity-80">Next up</p><p className="font-semibold">{when(next.startDate, next.endDate)}</p></div>
    </div>}

    {data && data.bookings.length === 0 && <EmptyState icon={<CalendarCheck className="size-5" />} title="Nothing assigned yet"
      description="When the business assigns you to a booking, it shows up here." />}

    {data && data.bookings.length > 0 && <ul className="space-y-3">
      {data.bookings.map(b => {
        const crew = data.team.filter(m => b.crew.includes(m.id) && m.id !== data.memberId);
        return <li key={b.id} className="space-y-3 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{when(b.startDate, b.endDate)}</p>
              <p className="text-xs text-muted-foreground">Booking {b.id.slice(0, 8)}</p>
            </div>
            <Badge variant="secondary" className="capitalize">{b.status.replaceAll("_", " ").toLowerCase()}</Badge>
          </div>
          <ul className="space-y-1 text-sm">{b.items.map(i => <li key={i.itemId} className="flex items-center gap-2">
            <Package className="size-3.5 text-muted-foreground" /><span className="font-medium tabular-nums">{i.quantity} ×</span>{names[i.itemId] ?? "…"}
          </li>)}</ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            {crew.length ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="flex -space-x-1.5">
              {crew.slice(0, 4).map(m => <StaffAvatar key={m.id} member={m} className="size-6 border-2 border-card text-[9px]" />)}</div>
              With {crew.map(m => m.name.split(" ")[0]).join(", ")}</div> : <span className="text-xs text-muted-foreground">Just you</span>}
            {HANDOVER.includes(b.status) && <Button size="sm" variant="outline" onClick={() => setHandover(b.id)}><ClipboardCheck className="size-3.5" />Handover notes</Button>}
          </div>
        </li>;
      })}
    </ul>}

    {data && data.timeOff.length > 0 && <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><CalendarOff className="size-4" />Your time off</h2>
      <ul className="space-y-1 text-sm text-muted-foreground">{data.timeOff.map(t => <li key={t.id}>{when(t.startDate, t.endDate)}{t.note && ` · ${t.note}`}</li>)}</ul>
    </section>}

    {handover && <HandoverDialog bookingId={handover} scope="team" onClose={() => setHandover(null)} />}
  </div>;
}
