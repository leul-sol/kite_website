import { etbMinor } from "./listing-photos";

export type ListingDetail = {
  id: string; name: string; description: string; categoryId: string; currency: string;
  pricePerDayMinor: number; securityDepositMinor: number; quantityAvailable: number; active: boolean; revision: number;
};
export type ListingEdit = Pick<ListingDetail, "name" | "description" | "categoryId" | "pricePerDayMinor" | "securityDepositMinor" | "quantityAvailable" | "active"> & { expectedRevision: number };
export function parseListingDetail(value: unknown): ListingDetail {
  const item = value as ListingDetail;
  if (!item || ![item.id, item.name, item.description, item.categoryId].every(field => typeof field === "string" && field.length > 0) ||
    item.currency !== "ETB" || typeof item.active !== "boolean" ||
    !Number.isSafeInteger(item.pricePerDayMinor) || item.pricePerDayMinor < 1 ||
    !Number.isSafeInteger(item.securityDepositMinor) || item.securityDepositMinor < 0 ||
    !Number.isSafeInteger(item.quantityAvailable) || item.quantityAvailable < 0 ||
    !Number.isSafeInteger(item.revision) || item.revision < 0) throw new Error("This editor requires valid ETB listing data. Refresh and try again.");
  return item;
}
export function listingEditPayload(item: ListingDetail, form: FormData): ListingEdit {
  const quantityAvailable = Number(form.get("stock"));
  if (!/^\d+$/.test(String(form.get("stock") ?? "")) || !Number.isSafeInteger(quantityAvailable) || quantityAvailable > 1000000 || quantityAvailable < 0)
    throw new Error("Enter a whole stock quantity between zero and 1,000,000.");
  const name = String(form.get("name") ?? "").trim(), description = String(form.get("description") ?? "").trim();
  if (!name || name.length > 255 || !description || description.length > 5000) throw new Error("Enter a listing name and description within the displayed limits.");
  return { expectedRevision: item.revision, name, description, categoryId: String(form.get("category") ?? ""),
    pricePerDayMinor: etbMinor(String(form.get("rate") ?? "")), securityDepositMinor: etbMinor(String(form.get("deposit") ?? ""), true),
    quantityAvailable, active: form.get("active") === "on" };
}
