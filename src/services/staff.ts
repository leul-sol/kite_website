import type { StaffConflict, StaffMember, StaffSchedule } from "./api";

/** Bookings that can still have staff changed (unpaid requests count until they expire). */
export const OPEN_STATUSES = ["REQUESTED", "PAID", "CONFIRMED", "PICKED_UP", "ACTIVE", "CANCELLATION_REQUESTED", "RESCHEDULE_REQUESTED"];
export const canAssignStaff = (status: string) => OPEN_STATUSES.includes(status);

/** Dates are plain yyyy-mm-dd strings and are compared as UTC days, like the backend. */
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function today(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

/** Monday of the week containing the day. */
export function weekStart(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

export function daysFrom(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export const overlaps = (start: string, end: string, from: string, to: string) => start <= to && end >= from;

/** "2026-06-21 - 2026-06-22" from an Order back into its two dates. */
export function orderRange(date: string): { start: string; end: string } | null {
  const match = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/.exec(date);
  return match ? { start: match[1], end: match[2] } : null;
}

export type Availability = { state: "free" | "off" | "busy"; detail: string };

/** Whether someone can work a booking, judged from a schedule covering its dates. */
export function availability(member: StaffMember, schedule: StaffSchedule, bookingId: string, start: string, end: string): Availability {
  const off = schedule.timeOff.find(t => t.memberId === member.id && overlaps(t.startDate, t.endDate, start, end));
  if (off) return { state: "off", detail: off.startDate === off.endDate ? `Off on ${shortDay(off.startDate)}` : `Off ${shortDay(off.startDate)} – ${shortDay(off.endDate)}` };
  const busy = schedule.bookings.filter(b => b.id !== bookingId && OPEN_STATUSES.includes(b.status)
    && b.staff.includes(member.id) && overlaps(b.startDate, b.endDate, start, end));
  if (busy.length) return { state: "busy", detail: `On ${busy.length} other booking${busy.length === 1 ? "" : "s"}` };
  return { state: "free", detail: "Available" };
}

export function describeConflict(conflict: StaffConflict, staff: StaffMember[]): string {
  const name = staff.find(member => member.id === conflict.memberId)?.name ?? "Someone";
  const when = conflict.startDate === conflict.endDate ? shortDay(conflict.startDate) : `${shortDay(conflict.startDate)} – ${shortDay(conflict.endDate)}`;
  return conflict.type === "TIME_OFF"
    ? `${name} is off ${when}.`
    : `${name} is already on booking ${conflict.bookingId?.slice(0, 8)} (${when}).`;
}

export function shortDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function parseSkills(value: string): string[] {
  return Array.from(new Set(value.split(",").map(skill => skill.trim()).filter(Boolean))).slice(0, 10);
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join("") || "?";
