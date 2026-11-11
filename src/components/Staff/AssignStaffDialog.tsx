"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { api, type StaffConflict, type StaffSchedule } from "@/services/api";
import { availability, describeConflict, shortDay } from "@/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import StaffAvatar from "./StaffAvatar";

const TONE = { free: "bg-success/10 text-success", off: "bg-destructive/10 text-destructive", busy: "bg-warning/10 text-warning" };

/** Pick who works a booking. Shows who is away or busy before saving, and asks before saving a clash. */
export default function AssignStaffDialog({ bookingId, start, end, title, onClose, onSaved }: {
  bookingId: string; start: string; end: string; title?: string; onClose: () => void; onSaved?: () => void;
}) {
  const [schedule, setSchedule] = useState<StaffSchedule>();
  const [selected, setSelected] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<StaffConflict[]>([]);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.getStaffSchedule(start, end).then(data => {
      if (!active) return;
      setSchedule(data);
      setSelected(data.bookings.find(b => b.id === bookingId)?.staff ?? []);
    }).catch(cause => { if (active) setError((cause as Error).message); });
    return () => { active = false; };
  }, [bookingId, start, end]);

  async function save(acknowledge: boolean) {
    setBusy(true); setError("");
    try {
      const result = await api.assignStaff(bookingId, selected, acknowledge);
      if (!result.saved) { setConflicts(result.conflicts); return; }
      toast.success(selected.length ? `Staff assigned to booking ${bookingId.slice(0, 8)}` : "Staff removed from booking");
      onSaved?.(); onClose();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  const toggle = (id: string) => { setConflicts([]); setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); };
  const staff = schedule?.staff ?? [];

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Assign staff</DialogTitle>
        <DialogDescription>{title ?? `Booking ${bookingId.slice(0, 8)}`} · {start === end ? shortDay(start) : `${shortDay(start)} – ${shortDay(end)}`}</DialogDescription>
      </DialogHeader>
      {error && <FormError>{error}</FormError>}
      {!schedule && !error && <div role="status" className="space-y-2"><span className="sr-only">Loading team…</span>{[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>}
      {schedule && staff.length === 0 && <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <Users className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No team members yet</p>
        <p className="text-xs text-muted-foreground">Add the people who work your events first.</p>
        <Button asChild size="sm" variant="outline"><Link href="/storefront">Add team in Storefront</Link></Button>
      </div>}
      {staff.length > 0 && <ul className="max-h-80 space-y-1.5 overflow-y-auto" aria-label="Team members">
        {staff.map(member => {
          const state = availability(member, schedule!, bookingId, start, end), on = selected.includes(member.id);
          return <li key={member.id}>
            <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition hover:bg-accent", on && "border-primary bg-primary/5")}>
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} disabled={busy} onChange={() => toggle(member.id)} />
              <StaffAvatar member={member} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{[member.role, ...member.skills].join(" · ")}</span>
              </span>
              <Badge variant="outline" className={cn("shrink-0 border-transparent text-[11px]", TONE[state.state])}>{state.detail}</Badge>
            </label>
          </li>;
        })}
      </ul>}
      {conflicts.length > 0 && <div role="alert" className="space-y-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-warning"><AlertTriangle className="size-4" />Check before saving</p>
        <ul className="list-disc space-y-0.5 pl-5 text-foreground">{conflicts.map((c, i) => <li key={i}>{describeConflict(c, staff)}</li>)}</ul>
      </div>}
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        {conflicts.length > 0
          ? <Button disabled={busy} onClick={() => void save(true)}>{busy ? "Saving…" : "Assign anyway"}</Button>
          : <Button disabled={busy || !schedule} onClick={() => void save(false)}>{busy ? "Saving…" : "Save staff"}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
