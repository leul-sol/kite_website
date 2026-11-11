import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole, MessageSquare, Package, Plus, RefreshCw, ShoppingBag, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/utils";
import { DashboardLoad, ProviderBookingDashboard, ProviderWalletDashboard, formatDashboardMoney } from "../../services/provider-dashboard";

const STATUS_TONE: Record<string, string> = {
  PAID: "bg-primary/10 text-primary", CONFIRMED: "bg-primary/10 text-primary", ACTIVE: "bg-success/10 text-success",
  PICKED_UP: "bg-success/10 text-success", COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-muted text-muted-foreground", EXPIRED: "bg-muted text-muted-foreground", REJECTED: "bg-muted text-muted-foreground",
  CANCELLATION_REQUESTED: "bg-warning/10 text-warning", RESCHEDULE_REQUESTED: "bg-warning/10 text-warning",
};

function Tile({ title, value, description, icon: Icon, loading, tone }: {
  title: string; value: string; description: string; icon: typeof Wallet; loading: boolean; tone: string;
}) {
  return <Card className="gap-3 py-5 shadow-xs">
    <CardContent className="space-y-3 px-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", tone)}><Icon className="size-4" /></span>
      </div>
      {loading ? <Skeleton className="h-8 w-28" /> : <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </CardContent>
  </Card>;
}

export default function DashboardView({ wallet, bookings, refresh }: {
  wallet: DashboardLoad<ProviderWalletDashboard>;
  bookings: DashboardLoad<ProviderBookingDashboard>;
  refresh: () => void;
}) {
  const funds = wallet.status === "ready" ? wallet.data : null;
  const data = bookings.status === "ready" ? bookings.data : null;
  const walletValue = (field: "availableMinor" | "heldEarningsMinor") => funds ? formatDashboardMoney(funds[field], funds.currency) : wallet.status === "loading" ? "Loading…" : "Unavailable";
  const count = (field: "awaitingConfirmation" | "currentRentals") => data ? data.counts[field].toLocaleString() : bookings.status === "loading" ? "Loading…" : "Unavailable";
  const busy = wallet.status === "loading" || bookings.status === "loading";
  const totals = data ? [
    ["All bookings", data.counts.totalBookings], ["Awaiting payment", data.counts.awaitingPayment],
    ["Change requests", data.counts.changeRequests], ["Completed", data.counts.completed],
    ["Closed / expired", data.counts.closed], ...(data.counts.other > 0 ? [["Other statuses", data.counts.other]] : []),
  ] as [string, number][] : [];

  return <div className="fade-in space-y-6">
    <PageHeader title="Overview" description="Your wallet balances and booking activity."
      actions={<>
        <Button variant="outline" size="sm" disabled={busy} onClick={refresh}>
          <RefreshCw className={cn("size-4", busy && "animate-spin")} />{busy ? "Refreshing…" : "Refresh dashboard"}
        </Button>
        <Button asChild size="sm"><Link href="/listings"><Plus className="size-4" />New listing</Link></Button>
      </>} />

    <div aria-live="polite" className="space-y-2 empty:hidden">
      {wallet.status === "error" && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">Wallet data could not be loaded. Refresh to try again.</p>}
      {bookings.status === "error" && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">Booking data could not be loaded. Refresh to try again.</p>}
      {busy && <p role="status" className="sr-only">Loading account data…</p>}
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile title="Available wallet balance" value={walletValue("availableMinor")} loading={wallet.status === "loading"} icon={Wallet} tone="bg-primary/10 text-primary"
        description="Your current ledger balance, including top-ups and transfers." />
      <Tile title="Held rental earnings" value={walletValue("heldEarningsMinor")} loading={wallet.status === "loading"} icon={LockKeyhole} tone="bg-highlight/20 text-warning"
        description="Funded rental earnings awaiting completion. Customer deposits are excluded." />
      <Tile title="Awaiting confirmation" value={count("awaitingConfirmation")} loading={bookings.status === "loading"} icon={Clock} tone="bg-warning/10 text-warning"
        description="Paid bookings waiting for provider confirmation." />
      <Tile title="Confirmed / in progress" value={count("currentRentals")} loading={bookings.status === "loading"} icon={ShoppingBag} tone="bg-success/10 text-success"
        description="Confirmed, picked-up and active bookings. Change requests are listed separately." />
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      {[{ href: "/listings", label: "Manage listings", hint: "Rentals and services", icon: Package },
        { href: "/orders", label: "Manage orders", hint: "Confirm and track bookings", icon: ShoppingBag },
        { href: "/messages", label: "Reply to customers", hint: "Questions before booking", icon: MessageSquare }].map(a =>
        <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-sm">
          <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground"><a.icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{a.label}</span><span className="block text-xs text-muted-foreground">{a.hint}</span></span>
          <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>)}
    </div>

    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="shadow-xs lg:col-span-3" aria-busy={bookings.status === "loading"}>
        <CardHeader>
          <CardTitle>Recent booking activity</CardTitle>
          <CardDescription>{data ? `Latest ${data.recentActivity.length} recorded status changes. Updated ${new Date(data.counts.asOf).toLocaleString()}.` : "Status changes on your bookings."}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.status === "loading" && <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}<span className="sr-only">Loading booking activity…</span></div>}
          {bookings.status === "error" && <p className="text-sm text-muted-foreground">Booking activity is unavailable.</p>}
          {data && !data.recentActivity.length && <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">No booking activity yet.</div>}
          {data && data.recentActivity.length > 0 && <ol className="relative space-y-4 border-l pl-5">
            {data.recentActivity.map(event => <li key={event.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">Booking {event.bookingId.slice(0, 8)}: {event.status.toLowerCase().replaceAll("_", " ")}</p>
                <Badge variant="outline" className={cn("border-transparent text-[10px] uppercase", STATUS_TONE[event.status] ?? "bg-muted text-muted-foreground")}>{event.status.replaceAll("_", " ")}</Badge>
              </div>
              <time dateTime={event.createdAt} className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</time>
            </li>)}
          </ol>}
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        <Card className="shadow-xs">
          <CardHeader><CardTitle>Booking totals</CardTitle></CardHeader>
          <CardContent>
            {data ? <dl className="divide-y">
              {totals.map(([label, value]) => <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value.toLocaleString()}</dd>
              </div>)}
            </dl> : bookings.status === "loading"
              ? <div className="space-y-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}<span className="sr-only">Loading booking totals…</span></div>
              : <p className="text-sm text-muted-foreground">Booking totals are unavailable.</p>}
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Released booking earnings</CardTitle>
            <CardDescription>Lifetime booking-earnings credits, including amounts you may have spent. Funded bookings appear in the ledger after settlement completes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {wallet.status === "loading" ? <><Skeleton className="h-8 w-32" /><span className="sr-only">Loading…</span></>
              : <p className="text-2xl font-semibold tracking-tight tabular-nums">{funds ? formatDashboardMoney(funds.releasedEarningsMinor, funds.currency) : "Unavailable"}</p>}
            {funds && <p className="text-xs text-muted-foreground">Wallet updated {new Date(funds.asOf).toLocaleString()}.</p>}
            <Button asChild variant="outline" size="sm" className="w-full"><Link href="/wallet">View wallet<ArrowRight className="size-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
}
