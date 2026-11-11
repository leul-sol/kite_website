export type ListingPhoto = { id: string; url: string; contentType: string; width: number; height: number };
export function photoUrl(url: string): string {
  if (/^\/api\/v1\/catalog\/(items|setups|storefronts)\/[a-f0-9-]{36}\/images\/[a-f0-9-]{36}\/content$/i.test(url)) return url.replace("/api/v1/", "/api/backend/");
  return /^https:\/\//i.test(url) ? url : "";
}
export function parsePhotos(value: unknown): ListingPhoto[] {
  if (!Array.isArray(value) || value.length > 5) throw new Error("Invalid photo response");
  return value.map(photo => {
    if (!photo || typeof photo.id !== "string" || !photo.id || typeof photo.url !== "string" || !photoUrl(photo.url) ||
      !["image/png", "image/jpeg"].includes(photo.contentType) || !Number.isInteger(photo.width) || photo.width < 1 ||
      !Number.isInteger(photo.height) || photo.height < 1) throw new Error("Invalid photo response");
    return { ...photo, url: photoUrl(photo.url) };
  });
}
export function validatePhoto(file: { size: number; type: string }) {
  if (file.size < 1 || file.size > 2 * 1024 * 1024) throw new Error("Choose a photo between 1 byte and 2 MiB.");
  if (!["image/png", "image/jpeg"].includes(file.type)) throw new Error("Choose a PNG or JPEG photo.");
}
export function etbMinor(value: string, allowZero = false): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter an ETB amount with up to two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < (allowZero ? 0 : 1)) throw new Error(allowZero ? "Enter a valid non-negative deposit." : "Enter a positive, valid daily rate.");
  return minor;
}
