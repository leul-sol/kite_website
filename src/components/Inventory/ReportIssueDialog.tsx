"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api, type InventoryItem, type IssueKind } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

export const ISSUE_KINDS: { id: IssueKind; label: string; hint: string }[] = [
  { id: "DAMAGED", label: "Damaged", hint: "Broken or stained, not usable" },
  { id: "IN_REPAIR", label: "In repair", hint: "Away being fixed" },
  { id: "LOST", label: "Lost", hint: "Missing or not returned" },
];

/** Take units out of service. Customers stop being able to book them straight away. */
export default function ReportIssueDialog({ items, itemId, bookingId, onClose, onSaved }: {
  items: InventoryItem[]; itemId?: string; bookingId?: string; onClose: () => void; onSaved?: () => void;
}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [kind, setKind] = useState<IssueKind>("DAMAGED");
  const [selected, setSelected] = useState(itemId ?? items[0]?.id ?? "");
  const item = items.find(i => i.id === selected);
  const left = item ? item.stock - item.outOfService : 0;

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Report an issue</DialogTitle>
        <DialogDescription>Units you report stop being bookable until you mark them back in stock.</DialogDescription>
      </DialogHeader>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">You have no rental listings yet.</p> :
        <form id="report-issue" className="grid gap-4" onSubmit={async event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy(true); setError("");
          try {
            await api.reportInventoryIssue({ itemId: selected, quantity: Number(form.get("quantity")), kind, note: String(form.get("note") ?? ""), bookingId });
            toast.success("Issue recorded. Those units are no longer bookable.");
            onSaved?.(); onClose();
          } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
        }}>
          {error && <FormError>{error}</FormError>}
          <fieldset disabled={busy} className="grid gap-4">
            <Field label="Listing"><select className={controlClass} value={selected} onChange={e => setSelected(e.target.value)}>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></Field>
            <div role="radiogroup" aria-label="What happened" className="grid grid-cols-3 gap-2">
              {ISSUE_KINDS.map(k => <button type="button" role="radio" aria-checked={kind === k.id} key={k.id} onClick={() => setKind(k.id)}
                className={cn("rounded-lg border p-2.5 text-left transition hover:bg-accent", kind === k.id && "border-primary bg-primary/5 ring-1 ring-primary")}>
                <span className="block text-sm font-medium">{k.label}</span><span className="text-[11px] leading-tight text-muted-foreground">{k.hint}</span>
              </button>)}
            </div>
            <Field label="How many units" hint={item ? `${left} of ${item.stock} are in service now.` : undefined}>
              <input name="quantity" type="number" min={1} max={Math.max(1, left)} defaultValue={1} required className={controlClass} />
            </Field>
            <Field label="Note (optional)"><textarea name="note" maxLength={500} className={cn(controlClass, "h-auto min-h-16 py-2")} placeholder="What happened, where it is being repaired…" /></Field>
          </fieldset>
        </form>}
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        {items.length > 0 && <Button type="submit" form="report-issue" disabled={busy || left < 1}>{busy ? "Saving…" : "Report issue"}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
