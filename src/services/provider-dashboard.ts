export type ProviderWalletDashboard = {
  availableMinor: string; heldEarningsMinor: string; releasedEarningsMinor: string;
  currency: string; asOf: string;
};
export type ProviderBookingCounts = {
  totalBookings: number; awaitingPayment: number; awaitingConfirmation: number;
  currentRentals: number; completed: number; changeRequests: number; closed: number;
  other: number; asOf: string;
};
export type ProviderBookingDashboard = {
  counts: ProviderBookingCounts;
  recentActivity: { id: string; bookingId: string; status: string; createdAt: string }[];
};
export type DashboardLoad<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid dashboard response");
  return value as Record<string, unknown>;
}
function date(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
export function parseWalletDashboard(value: unknown): ProviderWalletDashboard {
  const data = object(value);
  for (const field of ["availableMinor", "heldEarningsMinor", "releasedEarningsMinor"]) {
    if (typeof data[field] !== "string" || !/^\d{1,64}$/.test(data[field] as string)) throw new Error("Invalid wallet dashboard amount");
  }
  if (typeof data.currency !== "string" || !/^[A-Z]{3}$/.test(data.currency) || !date(data.asOf)) throw new Error("Invalid wallet dashboard metadata");
  return data as ProviderWalletDashboard;
}
export function parseBookingDashboard(value: unknown): ProviderBookingDashboard {
  const data = object(value), counts = object(data.counts);
  const fields = ["awaitingPayment", "awaitingConfirmation", "currentRentals", "completed", "changeRequests", "closed", "other"];
  for (const field of ["totalBookings", ...fields]) {
    if (!Number.isSafeInteger(counts[field]) || (counts[field] as number) < 0) throw new Error("Invalid booking count");
  }
  if (fields.reduce((sum, field) => sum + (counts[field] as number), 0) !== counts.totalBookings || !date(counts.asOf)) throw new Error("Invalid booking dashboard totals");
  if (!Array.isArray(data.recentActivity) || data.recentActivity.length > 10) throw new Error("Invalid booking activity");
  for (const item of data.recentActivity) {
    const row = object(item);
    if (![row.id, row.bookingId, row.status].every(field => typeof field === "string" && field.length > 0) || !date(row.createdAt)) throw new Error("Invalid booking activity");
  }
  return data as ProviderBookingDashboard;
}
export function formatDashboardMoney(minor: string, currency: string): string {
  const amount = BigInt(minor), scale = BigInt(100);
  return `${currency} ${(amount / scale).toLocaleString("en-US")}.${(amount % scale).toString().padStart(2, "0")}`;
}
