"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, ReceiptText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { etbMinor } from "@/services/listing-photos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

type Tx = { id: string; type: string; direction: string; amountMinor: number; createdAt: string };
const money = (minor: number, currency = "ETB") => `${currency} ${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const humanize = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());

export default function WalletPage() {
  const [wallet, setWallet] = useState<{ balanceMinor: number; currency: string }>();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [payout, setPayout] = useState(false), [busy, setBusy] = useState(false), [payoutError, setPayoutError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await api.getWallet(); setWallet(data.wallet); setTransactions(data.transactions); }
    catch (cause) { setError((cause as Error).message || "Wallet could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const credits = transactions.filter(tx => tx.direction === "CREDIT").reduce((total, tx) => total + tx.amountMinor, 0);
  const debits = transactions.filter(tx => tx.direction !== "CREDIT").reduce((total, tx) => total + tx.amountMinor, 0);
  const currency = wallet?.currency ?? "ETB";

  return <div className="fade-in space-y-6">
    <PageHeader title="Wallet" description="Your released earnings and payouts."
      actions={<Button variant="outline" size="icon" aria-label="Refresh wallet" disabled={loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>} />
    {error && <FormError>{error}</FormError>}

    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
      <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-16 size-32 rounded-full bg-white/5" />
        <p className="relative text-sm opacity-80">Available balance</p>
        {loading ? <Skeleton className="relative mt-2 h-10 w-48 bg-white/20" /> :
          <p className="relative mt-1 text-4xl font-semibold tracking-tight tabular-nums">{wallet ? money(wallet.balanceMinor, currency) : "—"}</p>}
        <Button variant="secondary" className="relative mt-6" disabled={!wallet || wallet.balanceMinor <= 0} onClick={() => { setPayoutError(""); setPayout(true); }}>
          <Banknote className="size-4" />Request payout</Button>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Money in</p><span className="grid size-8 place-items-center rounded-lg bg-success/10 text-success"><ArrowDownLeft className="size-4" /></span></div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{loading ? "…" : money(credits, currency)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Across recent transactions</p>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Money out</p><span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><ArrowUpRight className="size-4" /></span></div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{loading ? "…" : money(debits, currency)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Payouts and other debits</p>
      </div>
    </div>

    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <h2 className="border-b px-5 py-4 font-semibold">Transactions</h2>
      {loading && <div className="space-y-3 p-5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>}
      {!loading && transactions.length === 0 && <div className="p-5"><EmptyState icon={<ReceiptText className="size-5" />} title="No transactions yet"
        description="Earnings appear here once completed rentals are released." /></div>}
      {!loading && transactions.length > 0 && <ul className="divide-y">
        {transactions.map(tx => {
          const credit = tx.direction === "CREDIT";
          return <li key={tx.id} className="flex items-center gap-3 px-5 py-3">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", credit ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
              {credit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{humanize(tx.type)}</p>
              <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", credit ? "text-success" : "text-foreground")}>{credit ? "+" : "−"}{money(tx.amountMinor, currency)}</span>
          </li>;
        })}
      </ul>}
    </section>

    <Dialog open={payout} onOpenChange={open => { if (!busy) setPayout(open); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Request payout</DialogTitle>
          <DialogDescription>Available: {wallet ? money(wallet.balanceMinor, currency) : "—"}</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={async event => {
          event.preventDefault(); if (busy || !wallet) return;
          setPayoutError("");
          let amount: number;
          try { amount = etbMinor(String(new FormData(event.currentTarget).get("amount"))); }
          catch (cause) { setPayoutError((cause as Error).message); return; }
          if (amount <= 0 || amount > wallet.balanceMinor) { setPayoutError("Enter an amount up to your available balance."); return; }
          setBusy(true);
          try { await api.payout(amount); setPayout(false); toast.success("Payout requested"); await load(); }
          catch (cause) { setPayoutError((cause as Error).message); }
          finally { setBusy(false); }
        }}>
          {payoutError && <FormError>{payoutError}</FormError>}
          <Field label="Amount (ETB)"><input name="amount" required inputMode="decimal" autoFocus disabled={busy} className={controlClass}
            defaultValue={wallet ? (wallet.balanceMinor / 100).toFixed(2) : ""} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPayout(false)}>Cancel</Button>
            <Button disabled={busy}>{busy ? "Requesting..." : "Request payout"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
