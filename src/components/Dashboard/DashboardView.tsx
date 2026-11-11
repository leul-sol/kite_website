import Link from "next/link";
import { Wallet, LockKeyhole, Clock, ShoppingBag } from "lucide-react";
import SummaryCard from "./SummaryCard";
import styles from "./Dashboard.module.css";
import { DashboardLoad, ProviderBookingDashboard, ProviderWalletDashboard, formatDashboardMoney } from "../../services/provider-dashboard";

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
  return <div className="fade-in">
    <header className={styles.pageHeader}><div><h1 className="h1">Overview</h1><p className="text-body">Your wallet balances and booking activity.</p></div><button className="btn-secondary" disabled={busy} onClick={refresh}>{busy ? "Refreshing…" : "Refresh dashboard"}</button></header>
    <div aria-live="polite" className={styles.messages}>
      {wallet.status === "error" && <p role="alert">Wallet data could not be loaded. Refresh to try again.</p>}
      {bookings.status === "error" && <p role="alert">Booking data could not be loaded. Refresh to try again.</p>}
      {busy && <p role="status">Loading account data…</p>}
    </div>
    <div className={styles.dashboardGrid}>
      <SummaryCard title="Available wallet balance" value={walletValue("availableMinor")} description="Your current ledger balance, including top-ups and transfers." icon={Wallet} />
      <SummaryCard title="Held rental earnings" value={walletValue("heldEarningsMinor")} description="Funded rental earnings awaiting completion. Customer deposits are excluded." icon={LockKeyhole} />
      <SummaryCard title="Awaiting confirmation" value={count("awaitingConfirmation")} description="Paid bookings waiting for provider confirmation." icon={Clock} />
      <SummaryCard title="Confirmed / in progress" value={count("currentRentals")} description="Confirmed, picked-up and active bookings. Change requests are listed separately." icon={ShoppingBag} />
    </div>
    <div className={styles.chartSection}>
      <section className={`glass-card ${styles.panel}`} aria-busy={bookings.status === "loading"}>
        <h2 className="h3">Recent booking activity</h2>
        {data ? <>
          {!data.recentActivity.length && <p>No booking activity yet.</p>}
          <ul className={styles.activity}>{data.recentActivity.map(event => <li key={event.id}><span className={styles.activityDot} /><div><p>Booking {event.bookingId.slice(0, 8)}: {event.status.toLowerCase().replaceAll("_", " ")}</p><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></div></li>)}</ul>
          <p className="text-small">Latest {data.recentActivity.length} recorded status changes. Updated {new Date(data.counts.asOf).toLocaleString()}.</p>
        </> : <p>{bookings.status === "loading" ? "Loading booking activity…" : "Booking activity is unavailable."}</p>}
        <Link className="btn-secondary" href="/orders">Manage orders</Link>
      </section>
      <section className={`glass-card ${styles.panel}`}>
        <h2 className="h3">Booking totals</h2>
        {data ? <dl className={styles.totals}>
          <div><dt>All bookings</dt><dd>{data.counts.totalBookings.toLocaleString()}</dd></div>
          <div><dt>Awaiting payment</dt><dd>{data.counts.awaitingPayment.toLocaleString()}</dd></div>
          <div><dt>Change requests</dt><dd>{data.counts.changeRequests.toLocaleString()}</dd></div>
          <div><dt>Completed</dt><dd>{data.counts.completed.toLocaleString()}</dd></div>
          <div><dt>Closed / expired</dt><dd>{data.counts.closed.toLocaleString()}</dd></div>
          {data.counts.other > 0 && <div><dt>Other statuses</dt><dd>{data.counts.other.toLocaleString()}</dd></div>}
        </dl> : <p>{bookings.status === "loading" ? "Loading booking totals…" : "Booking totals are unavailable."}</p>}
        <h2 className="h3">Released booking earnings</h2>
        <p className={styles.cardValue}>{funds ? formatDashboardMoney(funds.releasedEarningsMinor, funds.currency) : wallet.status === "loading" ? "Loading…" : "Unavailable"}</p>
        <p className="text-small">Lifetime booking-earnings credits, including amounts you may have spent. Funded bookings appear in the ledger after settlement completes.</p>
        {funds && <p className="text-small">Wallet updated {new Date(funds.asOf).toLocaleString()}.</p>}
        <Link className="btn-secondary" href="/wallet">View wallet</Link>
      </section>
    </div>
  </div>;
}
