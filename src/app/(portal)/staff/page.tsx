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
import { useT } from "@/i18n/I18nProvider";
import { useStatusLabel } from "@/i18n/labels";

type Assigning = { booking: ScheduledBooking; title: string };

export default function StaffPage() {
  const [tab, setTab] = useState("schedule");
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [staff, setStaff] = useState<StaffMember[]>();
  const refresh = () => setRevision(value => value + 1);
  const { t } = useT();

  return <div className="fade-in">
    <PageHeader title={t("nav.staff")} description={t("stf.description")}
      actions={<Button variant="outline" disabled={!staff?.length} onClick={() => setTimeOffOpen(true)}><CalendarOff className="size-4" />{t("stf.addTimeOff")}</Button>} />
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <TabsList><TabsTrigger value="schedule">{t("stf.tab.schedule")}</TabsTrigger><TabsTrigger value="time-off">{t("stf.tab.timeOff")}</TabsTrigger></TabsList>
      <TabsContent value="schedule"><WeekSchedule revision={revision} onStaff={setStaff} onChanged={refresh} /></TabsContent>
      <TabsContent value="time-off"><TimeOffList revision={revision} onChanged={refresh} onAdd={() => setTimeOffOpen(true)} /></TabsContent>
    </Tabs>
    {timeOffOpen && staff && <TimeOffDialog staff={staff} onClose={() => setTimeOffOpen(false)} onSaved={refresh} />}
  </div>;
}

/** Listing names for booking chips; bookings only carry item ids. */
function useListingNames() {
  const [names, setNames] = useState<Record<string, string>>({});
  const { t } = useT();
  useEffect(() => { api.getListings().then(rows => setNames(Object.fromEntries(rows.map(r => [r.id, r.name])))).catch(() => undefined); }, []);
  return useCallback((booking: ScheduledBooking) => {
    const first = booking.itemIds.map(id => names[id]).find(Boolean);
    return first ? (booking.itemIds.length > 1 ? `${first} +${booking.itemIds.length - 1}` : first) : t("booking.ref", { ref: booking.id.slice(0, 8) });
  }, [names, t]);
}

function WeekSchedule({ revision, onStaff, onChanged }: { revision: number; onStaff: (staff: StaffMember[]) => void; onChanged: () => void }) {
  const [start, setStart] = useState(() => weekStart(today()));
  const [data, setData] = useState<StaffSchedule>(), [error, setError] = useState("");
  const [assigning, setAssigning] = useState<Assigning | null>(null);
  const label = useListingNames();
  const { t, tn, err, locale, date } = useT();
  const day = (d: string) => shortDay(d, locale);
  const statusLabel = useStatusLabel();
  const days = useMemo(() => daysFrom(start, 7), [start]);
  const end = days[6]!;

  useEffect(() => {
    let active = true; setData(undefined); setError("");
    api.getStaffSchedule(start, end).then(result => { if (active) { setData(result); onStaff(result.staff); } })
      .catch(cause => { if (active) setError(err(cause, "common.tryAgain")); });
    return () => { active = false; };
  }, [start, end, revision, onStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (data?.bookings ?? []).filter(b => canAssignStaff(b.status));
  const unassigned = open.filter(b => b.staff.length === 0);
  const assign = (booking: ScheduledBooking) => setAssigning({ booking, title: label(booking) });
  const now = today();

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label={t("stf.prevWeek")} onClick={() => setStart(addDays(start, -7))}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setStart(weekStart(today()))}>{t("stf.thisWeek")}</Button>
        <Button variant="outline" size="icon" aria-label={t("stf.nextWeek")} onClick={() => setStart(addDays(start, 7))}><ChevronRight className="size-4" /></Button>
      </div>
      <p className="text-sm font-medium">{day(start)} – {day(end)}</p>
    </div>
    {error && <FormError>{error}</FormError>}
    {!data && !error && <div role="status" className="space-y-2"><span className="sr-only">{t("stf.loading")}</span><Skeleton className="h-16" /><Skeleton className="h-48" /></div>}

    {data && unassigned.length > 0 && <section aria-label={t("stf.needsStaff")} className="rounded-xl border border-warning/40 bg-warning/5 p-4">
      <p className="mb-2 text-sm font-medium">{tn("stf.unassigned", unassigned.length)}</p>
      <div className="flex flex-wrap gap-2">{unassigned.map(b => <Button key={b.id} size="sm" variant="outline" className="bg-card" onClick={() => assign(b)}>
        <UserPlus className="size-3.5" />{label(b)} · {day(b.startDate)}</Button>)}</div>
    </section>}

    {data && data.staff.length === 0 && <EmptyState icon={<Users className="size-5" />} title={t("stf.addTeamFirst")}
      description={t("stf.addTeamText")}
      action={<Button asChild><Link href="/team">{t("stf.goTeam")}</Link></Button>} />}

    {data && data.staff.length > 0 && <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
      <table className="w-full min-w-[760px] table-fixed text-sm">
        <thead><tr className="border-b bg-muted/40">
          <th className="w-44 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{t("stf.team")}</th>
          {days.map(d => <th key={d} className={cn("px-1.5 py-2.5 text-center text-xs font-medium", d === now ? "text-primary" : "text-muted-foreground")}>
            <span className="block">{locale === "am" ? date(`${d}T00:00:00Z`, { weekday: "short", timeZone: "UTC" }) : new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span>
            <span className={cn("block text-base font-semibold", d === now ? "text-primary" : "text-foreground")}>{Number(d.slice(8))}</span>{d === now && <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{t("stf.today")}</span>}
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
                {off && <div title={off.note || t("stf.timeOff")} className="rounded-md bg-muted px-2 py-1 text-center text-[11px] font-medium text-muted-foreground">{t("stf.off")}</div>}
                {work.map(b => <button key={b.id} onClick={() => canAssignStaff(b.status) && assign(b)}
                  className={cn("block w-full truncate rounded-md px-2 py-1 text-left text-[11px] font-medium transition",
                    off ? "bg-destructive/10 text-destructive" : work.length > 1 ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary hover:bg-primary/20",
                    !canAssignStaff(b.status) && "cursor-default opacity-60")} title={`${label(b)} · ${statusLabel(b.status)}`}>
                  {label(b)}
                </button>)}
              </td>;
            })}
          </tr>)}
        </tbody>
      </table>
    </div>}
    {data && data.staff.length > 0 && <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/30" />{t("stf.legendWorking")}</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-warning/40" />{t("stf.legendDouble")}</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive/30" />{t("stf.legendOff")}</span>
      <span>{t("stf.legendClick")}</span>
    </p>}
    {assigning && <AssignStaffDialog bookingId={assigning.booking.id} start={assigning.booking.startDate} end={assigning.booking.endDate}
      title={assigning.title} onClose={() => setAssigning(null)} onSaved={onChanged} />}
  </div>;
}

function TimeOffList({ revision, onChanged, onAdd }: { revision: number; onChanged: () => void; onAdd: () => void }) {
  const [data, setData] = useState<StaffSchedule>(), [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  const { t, err, locale } = useT();
  const day = (d: string) => shortDay(d, locale);
  useEffect(() => {
    let active = true; setError("");
    const from = today();
    api.getStaffSchedule(from, addDays(from, 91)).then(result => { if (active) setData(result); }).catch(cause => { if (active) setError(err(cause, "common.tryAgain")); });
    return () => { active = false; };
  }, [revision]); // eslint-disable-line react-hooks/exhaustive-deps
  const name = (id: string) => data?.staff.find(member => member.id === id);

  return <div className="space-y-3">
    {error && <FormError>{error}</FormError>}
    {!data && !error && <Skeleton className="h-32" />}
    {data && data.timeOff.length === 0 && <EmptyState icon={<CalendarOff className="size-5" />} title={t("stf.noTimeOff")}
      description={t("stf.noTimeOffText")}
      action={data.staff.length > 0 && <Button onClick={onAdd}><Plus className="size-4" />{t("stf.addTimeOff")}</Button>} />}
    {data && data.timeOff.length > 0 && <ul className="divide-y rounded-xl border bg-card shadow-xs">
      {data.timeOff.map(entry => {
        const member = name(entry.memberId);
        return <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
          {member && <StaffAvatar member={member} />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{member?.name ?? t("stf.member")}</p>
            <p className="text-xs text-muted-foreground">{entry.startDate === entry.endDate ? day(entry.startDate) : `${day(entry.startDate)} – ${day(entry.endDate)}`}{entry.note && ` · ${entry.note}`}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label={t("stf.removeTimeOff")} disabled={busy === entry.id} onClick={async () => {
            setBusy(entry.id);
            try { await api.removeTimeOff(entry.id); toast.success(t("stf.timeOffRemoved")); onChanged(); }
            catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setBusy(null); }
          }}><Trash2 className="size-4" /></Button>
        </li>;
      })}
    </ul>}
    <p className="text-xs text-muted-foreground">{t("stf.next3")}</p>
  </div>;
}

function TimeOffDialog({ staff, onClose, onSaved }: { staff: StaffMember[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [start, setStart] = useState(today());
  const { t, tn, err } = useT();
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{t("stf.addTimeOff")}</DialogTitle><DialogDescription>{t("stf.dialogText")}</DialogDescription></DialogHeader>
      <form id="time-off" className="grid gap-4" onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const memberId = String(form.get("member")), name = staff.find(m => m.id === memberId)?.name ?? t("stf.thisPerson");
        setBusy(true); setError("");
        try {
          const result = await api.addTimeOff({ memberId, startDate: String(form.get("start")), endDate: String(form.get("end")), note: String(form.get("note") ?? "") });
          if (result.affectedBookings.length)
            toast.warning(tn("stf.affected", result.affectedBookings.length, { name }), { duration: 8000 });
          else toast.success(t("stf.added"));
          onSaved(); onClose();
        } catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setBusy(false); }
      }}>
        {error && <FormError>{error}</FormError>}
        <fieldset disabled={busy} className="grid gap-4">
          <Field label={t("stf.member")}><select name="member" className={controlClass} required>{staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("stf.firstDay")}><input name="start" type="date" className={controlClass} required value={start} onChange={e => setStart(e.target.value)} /></Field>
            <Field label={t("stf.lastDay")}><input name="end" type="date" className={controlClass} required min={start} defaultValue={start} key={start} /></Field>
          </div>
          <Field label={t("common.noteOptional")}><input name="note" className={controlClass} maxLength={200} placeholder={t("stf.notePlaceholder")} /></Field>
        </fieldset>
      </form>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" form="time-off" disabled={busy}>{busy ? t("common.saving") : t("stf.addTimeOff")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
