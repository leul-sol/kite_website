import { formatDashboardMoney } from "./provider-dashboard";

export type OrderStatus = string;
export type OrderTarget = "REJECTED" | "CONFIRMED" | "ACTIVE" | "CANCELLED" | "COMPLETED";
export type Order = {
  id: string; customerId: string; date: string; status: OrderStatus;
  /** English "ETB 123.45"; screens format totalMinor in the reader's language. */
  total: string; totalMinor: number; currency: string;
};
export type ChangeRequest = {
  id: string; request_type: string; status: string; reason: string | null; requested_role: string;
  requested_start_date: string | null; requested_end_date: string | null;
};
/** `title` is English; screens show t(key). */
export const orderColumns = [
  { id: "payment", title: "Awaiting payment", key: "ord.col.payment" },
  { id: "confirmation", title: "Awaiting confirmation", key: "ord.col.confirmation" },
  { id: "confirmed", title: "Confirmed", key: "ord.col.confirmed" },
  { id: "progress", title: "In progress", key: "ord.col.progress" },
  { id: "changes", title: "Change requests", key: "ord.col.changes" },
  { id: "completed", title: "Completed", key: "ord.col.completed" },
  { id: "closed", title: "Closed / expired", key: "ord.col.closed" },
  { id: "other", title: "Other statuses", key: "ord.col.other" },
] as const;
export function orderColumn(status: string): string {
  switch (status) {
    case "REQUESTED": return "payment";
    case "PAID": return "confirmation";
    case "CONFIRMED": return "confirmed";
    case "ACTIVE": case "PICKED_UP": return "progress";
    case "CANCELLATION_REQUESTED": case "RESCHEDULE_REQUESTED": return "changes";
    case "COMPLETED": return "completed";
    case "CANCELLED": case "REJECTED": case "REFUNDED": case "EXPIRED": return "closed";
    default: return "other";
  }
}
/** `label` is English; screens show t(`ord.act.${target}`). */
export function orderActions(status: string): { target: OrderTarget; label: string }[] {
  switch (status) {
    case "REQUESTED": return [{ target: "REJECTED", label: "Reject unpaid request" }];
    case "PAID": return [{ target: "CONFIRMED", label: "Confirm booking" }];
    case "CONFIRMED": return [{ target: "ACTIVE", label: "Start rental" }, { target: "CANCELLED", label: "Cancel booking" }];
    case "ACTIVE": return [{ target: "COMPLETED", label: "Complete rental" }];
    default: return [];
  }
}
export function isChangeRequest(status: string) {
  return status === "CANCELLATION_REQUESTED" || status === "RESCHEDULE_REQUESTED";
}
export function parseOrderChanges(value: unknown): ChangeRequest[] {
  if (!Array.isArray(value)) throw new Error("Invalid change request response");
  return value.map(change => {
    if (!change || typeof change.id !== "string" || !change.id ||
      !["CANCELLATION", "RESCHEDULE"].includes(change.request_type) ||
      !["OPEN", "APPROVED", "REJECTED"].includes(change.status) ||
      !["CUSTOMER", "PROVIDER", "ADMIN"].includes(change.requested_role) ||
      !(change.reason === null || typeof change.reason === "string") ||
      (change.request_type === "RESCHEDULE" &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(change.requested_start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(change.requested_end_date)))) {
      throw new Error("Invalid change request response");
    }
    return change as ChangeRequest;
  });
}
export function parseOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) throw new Error("Invalid booking response");
  return value.map(booking => {
    if (!booking || typeof booking.bookingId !== "string" || !booking.bookingId ||
      typeof booking.customerId !== "string" || typeof booking.status !== "string" || !booking.status ||
      !/^\d{4}-\d{2}-\d{2}$/.test(booking.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(booking.endDate) ||
      !Number.isSafeInteger(booking.totalMinor) || booking.totalMinor < 0 || !/^[A-Z]{3}$/.test(booking.currency)) {
      throw new Error("Invalid booking response");
    }
    return { id: booking.bookingId, customerId: booking.customerId, status: booking.status,
      date: `${booking.startDate} - ${booking.endDate}`,
      total: formatDashboardMoney(String(booking.totalMinor), booking.currency),
      totalMinor: booking.totalMinor, currency: booking.currency };
  });
}
