"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarOff, ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, type ScheduledBooking, type StaffMember, type StaffSchedule } from "@/services/api";
import { addDays, canAssignStaff, daysFrom, overlaps, parseSkills, shortDay, today, weekStart } from "@/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import AssignStaffDialog from "@/components/Staff/AssignStaffDialog";
import StaffAvatar from "@/components/Staff/StaffAvatar";

type Assigning = { booking: ScheduledBooking; title: string };

export default function StaffPage() {
  const [tab, setTab] = useState("schedule");
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [staff, setStaff] = useState<StaffMember[]>();
  const refresh = () => setRevision(value => value + 1);

  return <div className="fade-in">
    <PageHeader title="Schedule" description="Plan who works each booking and keep track of time off."
      actions={<Button variant="outline" disabled={!staff?.length} onClick={() => setTimeOffOpen(true)}><CalendarOff className="size-4" />Add time off</Button>} />
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <TabsList><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="time-off">Time off</TabsTrigger></TabsList>
      <TabsContent value="schedule"><WeekSchedule revision={revision} onStaff={setStaff} onChanged={refresh} /></TabsContent>
      <TabsContent value="time-off"><TimeOffList revision={revision} onChanged={refresh} onAdd={() => setTimeOffOpen(true)} /></TabsContent>
    </Tabs>
    {timeOffOpen && staff && <TimeOffDialog staff={staff} onClose={() => setTimeOffOpen(false)} onSaved={refresh} />}
  </div>;
}

/** Listing names for booking chips; bookings only carry item ids. */
function useListingNames() {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => { api.getListings().then(rows => setNames(Object.fromEntries(rows.map(r => [r.id, r.name])))).catch(() => undefined); }, []);
  return useCallback((booking: ScheduledBooking) => {
    const first = booking.itemIds.map(id => names[id]).find(Boolean);
    return first ? (booking.itemIds.length > 1 ? `${first} +${booking.itemIds.length - 1}` : first) : `Booking ${booking.id.slice(0, 8)}`;
  }, [names]);
}

function WeekSchedule({ revision, onStaff, onChanged }: { revision: number; onStaff: (staff: StaffMember[]) => void; onChanged: () => void }) {
  const [start, setStart] = useState(() => weekStart(today()));
  const [data, setData] = useState<StaffSchedule>(), [error, setError] = useState("");
  const [assigning, setAssigning] = useState<Assigning | null>(null);
  const label = useListingNames();
  const days = useMemo(() => daysFrom(start, 7), [start]);
  const end = days[6]!;

  useEffect(() => {
    let active = true; setData(undefined); setError("");
    api.getStaffSchedule(start, end).then(result => { if (active) { setData(result); onStaff(result.staff); } })
      .catch(cause => { if (active) setError((cause as Error).message); });
    return () => { active = false; };
  }, [start, end, revision, onStaff]);

  const open = (data?.bookings ?? []).filter(b => canAssignStaff(b.status));
  const unassigned = open.filter(b => b.staff.length === 0);
  const assign = (booking: ScheduledBooking) => setAssigning({ booking, title: label(booking) });
  const now = today();

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setStart(weekStart(today()))}>This week</Button>
        <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setStart(addDays(start, 7))}><ChevronRight className="size-4" /></Button>
      </div>
      <p className="text-sm font-medium">{shortDay(start)} – {shortDay(end)}</p>
    </div>
    {error && <FormError>{error}</FormError>}
    {!data && !error && <div role="status" className="space-y-2"><span className="sr-only">Loading schedule…</span><Skeleton className="h-16" /><Skeleton className="h-48" /></div>}

    {data && unassigned.length > 0 && <section aria-label="Needs staff" className="rounded-xl border border-warning/40 bg-warning/5 p-4">
      <p className="mb-2 text-sm font-medium">{unassigned.length} booking{unassigned.length === 1 ? "" : "s"} this week {unassigned.length === 1 ? "has" : "have"} nobody assigned</p>
      <div className="flex flex-wrap gap-2">{unassigned.map(b => <Button key={b.id} size="sm" variant="outline" className="bg-card" onClick={() => assign(b)}>
        <UserPlus className="size-3.5" />{label(b)} · {shortDay(b.startDate)}</Button>)}</div>
    </section>}

    {data && data.staff.length === 0 && <EmptyState icon={<Users className="size-5" />} title="Add your team first"
      description="Add the people who work your events on the Team page. Then assign them to bookings here."
      action={<Button asChild><Link href="/team">Go to Team</Link></Button>} />}

    {data && data.staff.length > 0 && <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
      <table className="w-full min-w-[760px] table-fixed text-sm">
        <thead><tr className="border-b bg-muted/40">
          <th className="w-44 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Team</th>
          {days.map(day => <th key={day} className={cn("px-1.5 py-2.5 text-center text-xs font-medium", day === now ? "text-primary" : "text-muted-foreground")}>
            <span className="block">{new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span>
            <span className={cn("block text-base font-semibold", day === now ? "text-primary" : "text-foreground")}>{Number(day.slice(8))}</span>{day === now && <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">Today</span>}
          </th>)}
        </tr></thead>
        <tbody>
          {data.staff.map(member => <tr key={member.id} className="border-b last:border-0">
            <td className="px-3 py-2 align-top">
              <div className="flex items-center gap-2"><StaffAvatar member={member} /><div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.role}</p></div></div>
            </td>
            {days.map(day => {
              const off = data.timeOff.find(t => t.memberId === member.id && overlaps(t.startDate, t.endDate, day, day));
              const work = data.bookings.filter(b => b.staff.includes(member.id) && overlaps(b.startDate, b.endDate, day, day));
              return <td key={day} className={cn("space-y-1 px-1.5 py-2 align-top", day === now && "bg-primary/[0.03]")}>
                {off && <div title={off.note || "Time off"} className="rounded-md bg-muted px-2 py-1 text-center text-[11px] font-medium text-muted-foreground">Off</div>}
                {work.map(b => <button key={b.id} onClick={() => canAssignStaff(b.status) && assign(b)}
                  className={cn("block w-full truncate rounded-md px-2 py-1 text-left text-[11px] font-medium transition",
                    off ? "bg-destructive/10 text-destructive" : work.length > 1 ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary hover:bg-primary/20",
                    !canAssignStaff(b.status) && "cursor-default opacity-60")} title={`${label(b)} · ${b.status.toLowerCase().replaceAll("_", " ")}`}>
                  {label(b)}
                </button>)}
              </td>;
            })}
          </tr>)}
        </tbody>
      </table>
    </div>}
    {data && data.staff.length > 0 && <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/30" />Working</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-warning/40" />More than one booking that day</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive/30" />Assigned while off</span>
      <span>Click a booking to change who works it.</span>
    </p>}
    {assigning && <AssignStaffDialog bookingId={assigning.booking.id} start={assigning.booking.startDate} end={assigning.booking.endDate}
      title={assigning.title} onClose={() => setAssigning(null)} onSaved={onChanged} />}
  </div>;
}

function TimeOffList({ revision, onChanged, onAdd }: { revision: number; onChanged: () => void; onAdd: () => void }) {
  const [data, setData] = useState<StaffSchedule>(), [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setError("");
    const from = today();
    api.getStaffSchedule(from, addDays(from, 91)).then(result => { if (active) setData(result); }).catch(cause => { if (active) setError((cause as Error).message); });
    return () => { active = false; };
  }, [revision]);
  const name = (id: string) => data?.staff.find(member => member.id === id);

  return <div className="space-y-3">
    {error && <FormError>{error}</FormError>}
    {!data && !error && <Skeleton className="h-32" />}
    {data && data.timeOff.length === 0 && <EmptyState icon={<CalendarOff className="size-5" />} title="No upcoming time off"
      description="Record holidays and days off so you don't assign someone who is away."
      action={data.staff.length > 0 && <Button onClick={onAdd}><Plus className="size-4" />Add time off</Button>} />}
    {data && data.timeOff.length > 0 && <ul className="divide-y rounded-xl border bg-card shadow-xs">
      {data.timeOff.map(entry => {
        const member = name(entry.memberId);
        return <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
          {member && <StaffAvatar member={member} />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{member?.name ?? "Team member"}</p>
            <p className="text-xs text-muted-foreground">{entry.startDate === entry.endDate ? shortDay(entry.startDate) : `${shortDay(entry.startDate)} – ${shortDay(entry.endDate)}`}{entry.note && ` · ${entry.note}`}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Remove time off" disabled={busy === entry.id} onClick={async () => {
            setBusy(entry.id);
            try { await api.removeTimeOff(entry.id); toast.success("Time off removed"); onChanged(); }
            catch (cause) { setError((cause as Error).message); } finally { setBusy(null); }
          }}><Trash2 className="size-4" /></Button>
        </li>;
      })}
    </ul>}
    <p className="text-xs text-muted-foreground">Showing the next 3 months.</p>
  </div>;
}

function TimeOffDialog({ staff, onClose, onSaved }: { staff: StaffMember[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [start, setStart] = useState(today());
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add time off</DialogTitle><DialogDescription>Kite warns you if this person is already assigned on these days.</DialogDescription></DialogHeader>
      <form id="time-off" className="grid gap-4" onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const memberId = String(form.get("member")), name = staff.find(m => m.id === memberId)?.name ?? "This person";
        setBusy(true); setError("");
        try {
          const result = await api.addTimeOff({ memberId, startDate: String(form.get("start")), endDate: String(form.get("end")), note: String(form.get("note") ?? "") });
          if (result.affectedBookings.length)
            toast.warning(`${name} is assigned to ${result.affectedBookings.length} booking${result.affectedBookings.length === 1 ? "" : "s"} during this time. Reassign ${result.affectedBookings.length === 1 ? "it" : "them"} in the schedule.`, { duration: 8000 });
          else toast.success("Time off added");
          onSaved(); onClose();
        } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
      }}>
        {error && <FormError>{error}</FormError>}
        <fieldset disabled={busy} className="grid gap-4">
          <Field label="Team member"><select name="member" className={controlClass} required>{staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First day off"><input name="start" type="date" className={controlClass} required value={start} onChange={e => setStart(e.target.value)} /></Field>
            <Field label="Last day off"><input name="end" type="date" className={controlClass} required min={start} defaultValue={start} key={start} /></Field>
          </div>
          <Field label="Note (optional)"><input name="note" className={controlClass} maxLength={200} placeholder="Annual leave" /></Field>
        </fieldset>
      </form>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" form="time-off" disabled={busy}>{busy ? "Saving…" : "Add time off"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
