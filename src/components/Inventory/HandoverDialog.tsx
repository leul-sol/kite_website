"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, PackageCheck, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { api, type Handover, type InventoryItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import ReportIssueDialog from "./ReportIssueDialog";
import { useT } from "@/i18n/I18nProvider";

/**
 * Check-out and check-in notes for a booking. Notes cannot be edited afterwards, so they can
 * back up a dispute. Finding issues on check-in offers to take damaged units out of service.
 */
export default function HandoverDialog({ bookingId, onClose, scope = "provider" }: { bookingId: string; onClose: () => void; scope?: "provider" | "team" }) {
  const read = scope === "team" ? api.getTeamHandovers : api.getHandovers;
  const write = scope === "team" ? api.addTeamHandover : api.addHandover;
  const [notes, setNotes] = useState<Handover[]>(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<Handover["kind"]>("CHECK_OUT"), [condition, setCondition] = useState<Handover["condition"]>("GOOD");
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState<InventoryItem[] | null>(null);
  const [offerReport, setOfferReport] = useState(false);
  const { t, err, date } = useT();

  useEffect(() => {
    read(bookingId).then(list => { setNotes(list); if (list.some(n => n.kind === "CHECK_OUT")) setKind("CHECK_IN"); })
      .catch(cause => setError(err(cause, "common.tryAgain")));
  }, [bookingId, read]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const saved = await write(bookingId, { kind, condition, note });
      setNotes(list => [...(list ?? []), saved]); setNote("");
      toast.success(kind === "CHECK_OUT" ? t("ho.outRecorded") : t("ho.inRecorded"));
      // Team members can't change inventory; the owner sees the note and takes units out of service.
      setOfferReport(scope === "provider" && kind === "CHECK_IN" && condition === "ISSUES");
      if (kind === "CHECK_OUT") setKind("CHECK_IN");
      setCondition("GOOD");
    } catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setBusy(false); }
  }

  if (reporting) return <ReportIssueDialog items={reporting} bookingId={bookingId} onClose={() => { setReporting(null); setOfferReport(false); }} />;

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("ho.title")}</DialogTitle>
        <DialogDescription>{t("ho.text", { ref: bookingId.slice(0, 8) })}</DialogDescription>
      </DialogHeader>
      {error && <FormError>{error}</FormError>}
      {!notes && !error && <Skeleton className="h-16" />}
      {notes && notes.length > 0 && <ol className="max-h-56 space-y-2 overflow-y-auto">
        {notes.map(n => <li key={n.id} className="flex gap-3 rounded-lg border p-3 text-sm">
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", n.condition === "GOOD" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
            {n.kind === "CHECK_OUT" ? <PackageOpen className="size-4" /> : <PackageCheck className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{n.kind === "CHECK_OUT" ? t("ho.checkedOut") : t("ho.checkedIn")} · {n.condition === "GOOD" ? t("ho.good") : t("ho.issues")}</p>
            {n.note && <p className="whitespace-pre-wrap text-muted-foreground">{n.note}</p>}
            <p className="text-xs text-muted-foreground">{date(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        </li>)}
      </ol>}
      {offerReport && <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        <span className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" />{t("ho.offerReport")}</span>
        <Button size="sm" onClick={async () => {
          try { setReporting((await api.getInventory()).items); } catch (cause) { setError(err(cause, "common.tryAgain")); }
        }}>{t("ho.reportDamage")}</Button>
      </div>}
      <form onSubmit={save} className="grid gap-3 border-t pt-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("ho.typeLabel")}>
          {(["CHECK_OUT", "CHECK_IN"] as const).map(k => <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={cn("rounded-lg border p-2.5 text-sm font-medium transition hover:bg-accent", kind === k && "border-primary bg-primary/5 ring-1 ring-primary")}>
            {k === "CHECK_OUT" ? t("ho.checkOut") : t("ho.checkIn")}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("ho.condition")}>
          {(["GOOD", "ISSUES"] as const).map(c => <button key={c} type="button" role="radio" aria-checked={condition === c} onClick={() => setCondition(c)}
            className={cn("flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-sm font-medium transition hover:bg-accent",
              condition === c && (c === "GOOD" ? "border-success bg-success/5 ring-1 ring-success" : "border-warning bg-warning/5 ring-1 ring-warning"))}>
            {c === "GOOD" ? <><CheckCircle2 className="size-4 text-success" />{t("ho.good")}</> : <><AlertTriangle className="size-4 text-warning" />{t("ho.issues")}</>}</button>)}
        </div>
        <Field label={condition === "ISSUES" ? t("ho.whatFound") : t("common.noteOptional")}>
          <textarea className={cn(controlClass, "h-auto min-h-16 py-2")} maxLength={1000} required={condition === "ISSUES"} value={note} onChange={e => setNote(e.target.value)}
            placeholder={condition === "ISSUES" ? t("ho.issuesPlaceholder") : t("ho.goodPlaceholder")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{t("common.close")}</Button>
          <Button disabled={busy}>{busy ? t("common.saving") : t("ho.save")}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
