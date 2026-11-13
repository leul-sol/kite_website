"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Info, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";
import { api, type PolicyState } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

// Provider-only. Platform controls, settlement review and the policy audit live in kite_admin.
const PRESETS = [{ id: "custom", label: "Custom", hint: "Set your own" }, { id: "0", label: "Flexible", hint: "0 hours notice" },
  { id: "24", label: "Moderate", hint: "24 hours notice" }, { id: "72", label: "Strict", hint: "72 hours notice" }];

export default function PoliciesPage() {
  const [caps, setCaps] = useState<{ platformControl: boolean; providerControl: boolean }>(), [platform, setPlatform] = useState<PolicyState>(), [own, setOwn] = useState<PolicyState>();
  const [terms, setTerms] = useState<Record<string, unknown>>(), [error, setError] = useState(""), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [preset, setPreset] = useState("custom");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const c = await api.getPolicyCapabilities(); setCaps(c); setPlatform(await api.getPlatformPolicy());
      if (c.providerControl) { const p = await api.getOwnPolicy(); setOwn(p.provider); setTerms(p.effective.terms); }
    } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !platform) return;
    const data = new FormData(event.currentTarget); setBusy(true); setError("");
    const number = (key: string) => Number(data.get(key));
    const rules = { cancellationNoticeHours: number("cancellationNoticeHours"), rescheduleNoticeHours: number("rescheduleNoticeHours"), rentalDays: number("rentalDays") };
    try {
      await api.saveOwnPolicy({ expectedVersion: own?.version ?? 0, expectedPlatformVersion: platform.version, reason: String(data.get("reason")), rules });
      await load(); toast.success("Policy saved for future bookings. Existing bookings retain their accepted terms.");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  const rules = platform?.rules;
  const values: Record<string, unknown> = terms ? { ...terms, ...(preset !== "custom" ? { cancellationNoticeHours: Number(preset), rescheduleNoticeHours: Number(preset) } : {}) } : {};

  return <div className="fade-in space-y-6">
    <PageHeader title="Policies" description="Cancellation and rescheduling rules for future bookings."
      actions={<Button variant="outline" disabled={busy || loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} />Reload policies</Button>} />
    {error && <FormError>{error}</FormError>}
    {loading && <div role="status" className="space-y-4"><span className="sr-only">Loading policies...</span><Skeleton className="h-32" /><Skeleton className="h-48" /></div>}

    {rules && !loading && <section className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Platform rules</h2>
        <Badge variant="secondary">Version {platform.version}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Fact icon={<Timer className="size-4" />} label="Maximum notice" value={`${String(rules.maxNoticeHours)} hours`} />
        <Fact icon={<CalendarClock className="size-4" />} label="Maximum rental" value={`${String(rules.maxRentalDays)} days`} />
        <Fact icon={<ShieldCheck className="size-4" />} label="Provider customization" value={rules.providerCustomization ? "Enabled" : "Disabled"} />
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" />Rental deadlines use 00:00 UTC on the start date.</li>
        <li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" />Approved cancellations refund 100% to the customer&apos;s Kite wallet.</li>
        <li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" />Earnings and remaining deposits are released after {String(rules.earningsApproval) === "ADMIN_APPROVAL" ? "independent admin approval" : "customer confirmation or independent admin approval"}.</li>
      </ul>
    </section>}

    {!loading && caps?.providerControl && terms && rules && <section className="rounded-xl border bg-card p-5 shadow-xs">
      <h2 className="mb-1 font-semibold">Your rental policy</h2>
      {rules.providerCustomization !== true ? <p className="text-sm text-muted-foreground">The platform currently uses mandatory defaults. Provider customization is disabled.</p> : <>
        <p className="mb-4 text-sm text-muted-foreground">{terms.providerOverrideApplied === true ? "Your saved override is active." : "Platform defaults apply until a valid provider override is saved."}</p>
        <div role="radiogroup" aria-label="Policy preset" className="mb-5 grid gap-2 sm:grid-cols-4">
          {PRESETS.map(p => <button type="button" role="radio" aria-checked={preset === p.id} key={p.id} disabled={busy} onClick={() => setPreset(p.id)}
            className={cn("rounded-lg border p-3 text-left transition hover:bg-accent", preset === p.id && "border-primary bg-primary/5 ring-1 ring-primary")}>
            <span className="block text-sm font-medium">{p.label}</span><span className="text-xs text-muted-foreground">{p.hint}</span>
          </button>)}
        </div>
        <form key={`provider-${own?.version}-${platform?.version}-${preset}`} onSubmit={event => void save(event)}>
          <fieldset disabled={busy} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cancellation notice hours"><input className={controlClass} name="cancellationNoticeHours" type="number" min={0} max={Number(rules.maxNoticeHours)} step={1} required defaultValue={String(values.cancellationNoticeHours)} /></Field>
              <Field label="Reschedule notice hours"><input className={controlClass} name="rescheduleNoticeHours" type="number" min={0} max={Number(rules.maxNoticeHours)} step={1} required defaultValue={String(values.rescheduleNoticeHours)} /></Field>
              <Field label="Maximum rental days"><input className={controlClass} name="rentalDays" type="number" min={1} max={Number(rules.maxRentalDays)} step={1} required defaultValue={String(values.rentalDays)} /></Field>
            </div>
            <Field label="Change reason"><textarea className={cn(controlClass, "h-auto min-h-20 py-2")} name="reason" required maxLength={1000} /></Field>
            <label className="flex items-center gap-2 text-sm"><input required type="checkbox" className="size-4 accent-[var(--primary)]" />I confirm this policy change for future bookings</label>
            <div className="flex justify-end"><Button>{busy ? "Saving..." : "Save provider policy"}</Button></div>
          </fieldset>
        </form>
      </>}
    </section>}
  </div>;
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>
  </div>;
}
