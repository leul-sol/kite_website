import { TextError } from "@/i18n/errors";
import { etbMinor } from "./listing-photos";

export type PricingUnit = "DAY" | "EVENT" | "HOUR" | "PERSON";
export type Offer = { listingType: "RENTAL" | "SERVICE"; pricingUnit: PricingUnit; minUnits: number; maxUnits: number | null };
export type ListingDetail = {
  id: string; name: string; description: string; categoryId: string; currency: string;
  pricePerDayMinor: number; securityDepositMinor: number; quantityAvailable: number; active: boolean; revision: number;
} & Partial<Offer>;
export type ListingEdit = Pick<ListingDetail, "name" | "description" | "categoryId" | "pricePerDayMinor" | "securityDepositMinor" | "quantityAvailable" | "active"> & { expectedRevision: number } & Offer;

/** Current offer of a listing; older responses without these fields are rentals per day. */
export function offerOf(item: Partial<Offer>): Offer {
  return { listingType: item.listingType === "SERVICE" ? "SERVICE" : "RENTAL", pricingUnit: item.pricingUnit ?? "DAY",
    minUnits: item.minUnits ?? 1, maxUnits: item.maxUnits ?? null };
}

/** Reads the OfferFields inputs and checks them before anything is sent. */
export function offerPayload(form: FormData): Offer {
  const listingType = form.get("listingType") === "SERVICE" ? "SERVICE" : "RENTAL";
  const unit = String(form.get("pricingUnit") ?? "DAY") as PricingUnit;
  if (!["DAY", "EVENT", "HOUR", "PERSON"].includes(unit)) throw new TextError("err.pricing");
  const pricingUnit: PricingUnit = listingType === "RENTAL" ? "DAY" : unit;
  if (pricingUnit !== "HOUR" && pricingUnit !== "PERSON") return { listingType, pricingUnit, minUnits: 1, maxUnits: null };
  const minRaw = String(form.get("minUnits") ?? "1"), maxRaw = String(form.get("maxUnits") ?? "").trim();
  const minUnits = Number(minRaw), maxUnits = maxRaw === "" ? null : Number(maxRaw);
  const noun = pricingUnit === "HOUR" ? "hours" : "guests";
  if (!/^\d+$/.test(minRaw) || minUnits < 1 || minUnits > 10000) throw new TextError(noun === "hours" ? "err.minHours" : "err.minGuests");
  if (maxUnits !== null && (!/^\d+$/.test(maxRaw) || maxUnits < minUnits || maxUnits > 10000)) throw new TextError(noun === "hours" ? "err.maxHours" : "err.maxGuests");
  return { listingType, pricingUnit, minUnits, maxUnits };
}
export function parseListingDetail(value: unknown): ListingDetail {
  const item = value as ListingDetail;
  if (!item || ![item.id, item.name, item.description, item.categoryId].every(field => typeof field === "string" && field.length > 0) ||
    item.currency !== "ETB" || typeof item.active !== "boolean" ||
    !Number.isSafeInteger(item.pricePerDayMinor) || item.pricePerDayMinor < 1 ||
    !Number.isSafeInteger(item.securityDepositMinor) || item.securityDepositMinor < 0 ||
    !Number.isSafeInteger(item.quantityAvailable) || item.quantityAvailable < 0 ||
    !Number.isSafeInteger(item.revision) || item.revision < 0) throw new TextError("err.invalidListing");
  return item;
}
export function listingEditPayload(item: ListingDetail, form: FormData): ListingEdit {
  const quantityAvailable = Number(form.get("stock"));
  if (!/^\d+$/.test(String(form.get("stock") ?? "")) || !Number.isSafeInteger(quantityAvailable) || quantityAvailable > 1000000 || quantityAvailable < 0)
    throw new TextError("err.stockRange");
  const name = String(form.get("name") ?? "").trim(), description = String(form.get("description") ?? "").trim();
  if (!name || name.length > 255 || !description || description.length > 5000) throw new TextError("err.nameDesc");
  return { ...offerPayload(form), expectedRevision: item.revision, name, description, categoryId: String(form.get("category") ?? ""),
    pricePerDayMinor: etbMinor(String(form.get("rate") ?? "")), securityDepositMinor: etbMinor(String(form.get("deposit") ?? ""), true),
    quantityAvailable, active: form.get("active") === "on" };
}
