"use client";
import { useEffect, useState } from "react";
import { BarChart3, CalendarCheck, Download, PackageCheck, Wallet } from "lucide-react";
import { api, type BookingAnalytics, type EarningsAnalytics } from "@/services/api";
import { formatDashboardMoney } from "@/services/provider-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, Stat } from "@/components/shell/PageHeader";
import { FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const PERIODS = [7, 30, 90, 365];
const sum = (values: string[]) => values.reduce((total, value) => total + BigInt(value || "0"), BigInt(0)).toString();

export default function AnalyticsPage() {
  const [days, setDays] = useState(30), [bookings, setBookings] = useState<BookingAnalytics>(), [earnings, setEarnings] = useState<EarningsAnalytics>();
  const [error, setError] = useState(""), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true); setBookings(undefined); setEarnings(undefined); setError("");
    void Promise.allSettled([
      api.getBookingAnalytics(days).then(data => { if (active) setBookings(data); }),
      api.getEarningsAnalytics(days).then(data => { if (active) setEarnings(data); }),
    ]).then(results => {
      if (!active) return;
      if (results.some(result => result.status === "rejected")) setError("Some analytics could not be loaded. Change the period to retry.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [days]);

  const csv = () => {
    if (!bookings || !earnings) return;
    const rows = [["UTC date", "Bookings created", "Currently completed", "Currently closed", "ETB booked subtotal minor", "ETB released earnings minor"],
      ...bookings.daily.map(row => [row.date, String(row.bookings), String(row.completed), String(row.closed), row.bookedValueMinor, earnings.daily.find(day => day.date === row.date)?.releasedMinor ?? ""])];
    const url = URL.createObjectURL(new Blob([rows.map(row => row.join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "kite-provider-analytics.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const peak = bookings ? Math.max(1, ...bookings.daily.map(day => day.bookings)) : 1;
  const totalBookings = bookings?.daily.reduce((total, day) => total + day.bookings, 0) ?? 0;
  const totalCompleted = bookings?.daily.reduce((total, day) => total + day.completed, 0) ?? 0;
  const active = bookings?.daily.filter(day => day.bookings > 0) ?? [];

  return <div className="fade-in space-y-6">
    <PageHeader title="Analytics" description="How your bookings and earnings are trending."
      actions={<>
        <select aria-label="Reporting period" className={cn(controlClass, "w-40")} value={days} onChange={event => setDays(Number(event.target.value))}>
          {PERIODS.map(day => <option key={day} value={day}>Last {day} days</option>)}
        </select>
        <Button variant="outline" disabled={!bookings || !earnings} onClick={csv}><Download className="size-4" />Export analytics CSV</Button>
      </>} />
    {error && <FormError>{error}</FormError>}
    {loading && <div role="status" className="space-y-4"><span className="sr-only">Loading analytics...</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /></div>}

    {!loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Bookings created" value={bookings ? totalBookings : "—"} icon={<CalendarCheck className="size-4" />} tone="primary" />
      <Stat label="Completed" value={bookings ? totalCompleted : "—"} icon={<PackageCheck className="size-4" />} tone="success" hint="Current outcome of this period's bookings" />
      <Stat label="Booked subtotal" value={bookings ? formatDashboardMoney(sum(bookings.daily.map(day => day.bookedValueMinor)), "ETB") : "—"} icon={<BarChart3 className="size-4" />} hint="Not wallet earnings" />
      <Stat label="Released earnings" value={earnings ? formatDashboardMoney(sum(earnings.daily.map(day => day.releasedMinor)), "ETB") : "—"} icon={<Wallet className="size-4" />} tone="success" hint="Excludes deposits" />
    </div>}

    {bookings && <section className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="mb-4">
        <h2 className="font-semibold">Bookings created per day</h2>
        <p className="text-sm text-muted-foreground">UTC days. Hover a bar to see the count.</p>
      </div>
      {totalBookings === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No bookings in this period yet.</p> :
        <div role="img" aria-label="Bookings created per day" className="flex h-48 items-end gap-[2px]">
          {bookings.daily.map(day => <div key={day.date} title={`${day.date}: ${day.bookings} bookings`}
            className="group relative flex-1 rounded-t-sm bg-primary/80 transition hover:bg-primary"
            style={{ height: `${Math.max(day.bookings ? 4 : 1, (day.bookings / peak) * 100)}%`, opacity: day.bookings ? 1 : 0.25 }} />)}
        </div>}
      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{bookings.startDate}</span><span>{bookings.endDate}</span></div>
    </section>}

    {bookings && <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <h2 className="border-b px-5 py-4 font-semibold">Days with bookings</h2>
        {active.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing to show for this period.</p> :
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr>
              {["UTC date", "Created", "Completed", "Closed", "Booked subtotal", "Released earnings"].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>{active.map(day => <tr key={day.date} className="border-t">
              <td className="px-4 py-2.5">{day.date}</td><td className="px-4 py-2.5 tabular-nums">{day.bookings}</td>
              <td className="px-4 py-2.5 tabular-nums">{day.completed}</td><td className="px-4 py-2.5 tabular-nums">{day.closed}</td>
              <td className="px-4 py-2.5 tabular-nums">{formatDashboardMoney(day.bookedValueMinor, "ETB")}</td>
              <td className="px-4 py-2.5 tabular-nums">{earnings ? formatDashboardMoney(earnings.daily.find(row => row.date === day.date)?.releasedMinor ?? "0", "ETB") : "Unavailable"}</td>
            </tr>)}</tbody>
          </table></div>}
      </section>
      <section className="rounded-xl border bg-card p-5 shadow-xs">
        <h2 className="font-semibold">Most booked items</h2>
        <p className="mb-3 text-xs text-muted-foreground">Ranked by booked quantity × rental days on funded bookings.</p>
        {bookings.topItems.length === 0 ? <EmptyState icon={<PackageCheck className="size-5" />} title="No funded bookings yet" /> :
          <ol className="space-y-2">{bookings.topItems.map((item, index) => <li key={item.itemId} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">Item {item.itemId.slice(0, 8)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{item.units} units · {item.bookedUnitDays} unit-days</span>
          </li>)}</ol>}
      </section>
    </div>}
  </div>;
}
