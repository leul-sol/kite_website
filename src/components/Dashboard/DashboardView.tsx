import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole, MessageSquare, Package, Plus, RefreshCw, ShoppingBag, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/translate";
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
  const { t, date, locale } = useT();
  const when = (iso: string) => date(iso, { dateStyle: "medium", timeStyle: "short" });
  const statusLabel = (status: string) => t(`status.${status}` as MessageKey) === `status.${status}` ? status.toLowerCase().replaceAll("_", " ") : t(`status.${status}` as MessageKey);
  const funds = wallet.status === "ready" ? wallet.data : null;
  const data = bookings.status === "ready" ? bookings.data : null;
  const walletValue = (field: "availableMinor" | "heldEarningsMinor") => funds ? formatDashboardMoney(funds[field], funds.currency, locale) : wallet.status === "loading" ? t("common.loading") : t("common.unavailable");
  const count = (field: "awaitingConfirmation" | "currentRentals") => data ? data.counts[field].toLocaleString() : bookings.status === "loading" ? t("common.loading") : t("common.unavailable");
  const busy = wallet.status === "loading" || bookings.status === "loading";
  const totals = data ? [
    [t("dash.totalAll"), data.counts.totalBookings], [t("dash.totalAwaitingPayment"), data.counts.awaitingPayment],
    [t("dash.totalChanges"), data.counts.changeRequests], [t("dash.totalCompleted"), data.counts.completed],
    [t("dash.totalClosed"), data.counts.closed], ...(data.counts.other > 0 ? [[t("dash.totalOther"), data.counts.other]] : []),
  ] as [string, number][] : [];

  return <div className="fade-in space-y-6">
    <PageHeader title={t("dash.title")} description={t("dash.description")}
      actions={<>
        <Button variant="outline" size="sm" disabled={busy} onClick={refresh}>
          <RefreshCw className={cn("size-4", busy && "animate-spin")} />{busy ? t("dash.refreshing") : t("dash.refresh")}
        </Button>
        <Button asChild size="sm"><Link href="/listings"><Plus className="size-4" />{t("dash.newListing")}</Link></Button>
      </>} />

    <div aria-live="polite" className="space-y-2 empty:hidden">
      {wallet.status === "error" && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{t("dash.walletError")}</p>}
      {bookings.status === "error" && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{t("dash.bookingsError")}</p>}
      {busy && <p role="status" className="sr-only">{t("dash.loadingAccount")}</p>}
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile title={t("dash.available")} value={walletValue("availableMinor")} loading={wallet.status === "loading"} icon={Wallet} tone="bg-primary/10 text-primary"
        description={t("dash.availableText")} />
      <Tile title={t("dash.held")} value={walletValue("heldEarningsMinor")} loading={wallet.status === "loading"} icon={LockKeyhole} tone="bg-highlight/20 text-warning"
        description={t("dash.heldText")} />
      <Tile title={t("dash.awaiting")} value={count("awaitingConfirmation")} loading={bookings.status === "loading"} icon={Clock} tone="bg-warning/10 text-warning"
        description={t("dash.awaitingText")} />
      <Tile title={t("dash.current")} value={count("currentRentals")} loading={bookings.status === "loading"} icon={ShoppingBag} tone="bg-success/10 text-success"
        description={t("dash.currentText")} />
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      {[{ href: "/listings", label: t("dash.manageListings"), hint: t("dash.manageListingsHint"), icon: Package },
        { href: "/orders", label: t("dash.manageOrders"), hint: t("dash.manageOrdersHint"), icon: ShoppingBag },
        { href: "/messages", label: t("dash.reply"), hint: t("dash.replyHint"), icon: MessageSquare }].map(a =>
        <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-sm">
          <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground"><a.icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{a.label}</span><span className="block text-xs text-muted-foreground">{a.hint}</span></span>
          <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>)}
    </div>

    <div className="grid items-start gap-4 lg:grid-cols-5">
      <Card className="shadow-xs lg:col-span-3" aria-busy={bookings.status === "loading"}>
        <CardHeader>
          <CardTitle>{t("dash.activity")}</CardTitle>
          <CardDescription>{data ? t("dash.activityText", { count: data.recentActivity.length, date: when(data.counts.asOf) }) : t("dash.activityEmptyText")}</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.status === "loading" && <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}<span className="sr-only">{t("dash.loadingActivity")}</span></div>}
          {bookings.status === "error" && <p className="text-sm text-muted-foreground">{t("dash.activityUnavailable")}</p>}
          {data && !data.recentActivity.length && <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{t("dash.noActivity")}</div>}
          {data && data.recentActivity.length > 0 && <ol className="relative space-y-4 border-l pl-5">
            {data.recentActivity.map(event => <li key={event.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{t("dash.bookingEvent", { ref: event.bookingId.slice(0, 8), status: statusLabel(event.status).toLowerCase() })}</p>
                <Badge variant="outline" className={cn("border-transparent text-[10px] uppercase", STATUS_TONE[event.status] ?? "bg-muted text-muted-foreground")}>{locale === "en" ? event.status.replaceAll("_", " ") : statusLabel(event.status)}</Badge>
              </div>
              <time dateTime={event.createdAt} className="text-xs text-muted-foreground">{when(event.createdAt)}</time>
            </li>)}
          </ol>}
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-2">
        <Card className="shadow-xs">
          <CardHeader><CardTitle>{t("dash.totals")}</CardTitle></CardHeader>
          <CardContent>
            {data ? <dl className="divide-y">
              {totals.map(([label, value]) => <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value.toLocaleString()}</dd>
              </div>)}
            </dl> : bookings.status === "loading"
              ? <div className="space-y-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}<span className="sr-only">{t("dash.loadingTotals")}</span></div>
              : <p className="text-sm text-muted-foreground">{t("dash.totalsUnavailable")}</p>}
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>{t("dash.released")}</CardTitle>
            <CardDescription>{t("dash.releasedText")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {wallet.status === "loading" ? <><Skeleton className="h-8 w-32" /><span className="sr-only">{t("common.loading")}</span></>
              : <p className="text-2xl font-semibold tracking-tight tabular-nums">{funds ? formatDashboardMoney(funds.releasedEarningsMinor, funds.currency, locale) : t("common.unavailable")}</p>}
            {funds && <p className="text-xs text-muted-foreground">{t("dash.walletUpdated", { date: when(funds.asOf) })}</p>}
            <Button asChild variant="outline" size="sm" className="w-full"><Link href="/wallet">{t("dash.viewWallet")}<ArrowRight className="size-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
}
