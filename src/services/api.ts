const API_BASE_URL = "/api/backend";
import { parseBookingDashboard, parseWalletDashboard } from "./provider-dashboard";
import { parseOrders, parseOrderChanges, type Order, type OrderTarget } from "./orders";
import { parsePhotos, photoUrl } from "./listing-photos";
import { parseListingDetail, type ListingEdit } from "./listing-edit";
export type { Order, OrderStatus } from "./orders";
let refreshInFlight: Promise<Response> | undefined;

export async function backendFetch(path: string, options?: RequestInit): Promise<Response> {
  const send = () => fetch(`${API_BASE_URL}${path.replace(/^\/api\/v1/, "")}`, { ...options, cache: "no-store" });
  let response = await send();
  if (response.status === 401 && !path.includes("/auth/")) {
    const renew = async () => {
      // A different request or tab may have renewed the cookies while we waited.
      const retry = await send();
      if (retry.status !== 401) return retry;
      refreshInFlight ??= fetch(`${API_BASE_URL}/auth/refresh`, { method: "POST" }).finally(() => { refreshInFlight = undefined; });
      const refreshed = await refreshInFlight;
      if (refreshed.ok) return send();
      if (refreshed.status === 401 || refreshed.status === 403) window.location.assign("/auth/login");
      return refreshed;
    };
    response = navigator.locks ? await navigator.locks.request("kite-session-refresh", renew) : await renew();
  }
  return response;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await backendFetch(path, {
    ...options,
    headers: {
      ...(!(options?.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new ApiError(problem.detail ?? problem.error ?? problem.message ?? `Request failed (${response.status})`, response.status);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return (await response.json()) as T;
}

export type Listing = {
  id: string;
  name: string;
  category: string;
  priceMinor: number;
  status: "Active" | "Inactive";
  stock: number;
  image: string;
  currency: string;
};

export type PolicyState={version:number;rules:Record<string,number|boolean|string>|null};
export const api = {
  getPolicyCapabilities:()=>request<{platformControl:boolean;providerControl:boolean}>("/api/v1/bookings/policies/capabilities"),
  getPlatformPolicy:()=>request<PolicyState>("/api/v1/bookings/policies/platform"),
  getOwnPolicy:()=>request<{platform:PolicyState;provider:PolicyState;effective:{hash:string;terms:Record<string,unknown>}}>("/api/v1/bookings/policies/provider"),
  saveOwnPolicy:(body:object)=>request<PolicyState>("/api/v1/bookings/policies/provider",{method:"PUT",body:JSON.stringify(body)}),
  getBookingAnalytics:(days:number)=>request<BookingAnalytics>(`/api/v1/bookings/provider/analytics?days=${days}`),
  getEarningsAnalytics:(days:number)=>request<EarningsAnalytics>(`/api/v1/wallet/provider/analytics?days=${days}`),
  getDisputes:(id:string)=>request<Dispute[]>(`/api/v1/bookings/${encodeURIComponent(id)}/disputes`),
  openDispute:(id:string,reason:string)=>request(`/api/v1/bookings/${encodeURIComponent(id)}/disputes`,{method:"POST",body:JSON.stringify({reason,evidenceUrls:[]})}),
  async getProviderBookingDashboard(signal?: AbortSignal) {
    return parseBookingDashboard(await request("/api/v1/bookings/provider/dashboard", { signal }));
  },
  async getProviderWalletDashboard(signal?: AbortSignal) {
    return parseWalletDashboard(await request("/api/v1/wallet/provider/dashboard", { signal }));
  },
  auth(action: string, payload: object = {}) {
    return request<{ message?: string }>(`/api/v1/auth/${action}`, { method: "POST", body: JSON.stringify(payload) });
  },
  updateProviderProfile(profile: { businessName: string; location: string; bio: string }) {
    return request("/api/v1/providers/me", { method: "PUT", body: JSON.stringify(profile) });
  },
  getKycSummary: () => request<KycSummary>("/api/v1/providers/me/kyc"),
  getKycDocuments: () => request<KycDocument[]>("/api/v1/providers/me/kyc/documents"),
  getKycSubmissions: () => request<KycSubmission[]>("/api/v1/providers/me/kyc/submissions"),
  uploadKycDocument(type: string, file: File) {
    const body = new FormData(); body.set("type", type); body.set("file", file);
    return request<KycDocument>("/api/v1/providers/me/kyc/documents", { method: "POST", body });
  },
  deleteKycDocument: (id: string) => request(`/api/v1/providers/me/kyc/documents/${id}`, { method: "DELETE" }),
  submitKyc: (documentIds: string[], key: string) => request<KycSubmission>("/api/v1/providers/me/kyc/submissions", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify({ documentIds }) }),
  withdrawKyc: (id: string, reason: string) => request(`/api/v1/providers/me/kyc/submissions/${id}/withdraw`, { method: "POST", body: JSON.stringify({ reason }) }),
  getPublicProvider: (providerId: string) => request<ProviderProfile>(`/api/v1/providers/${encodeURIComponent(providerId)}`),
  async getListings(): Promise<Listing[]> {
    const items = await request<
      Array<{
        id: string;
        name: string;
        categoryId?: string;
        pricePerDayMinor: number;
        active?: boolean;
        quantityAvailable: number;
        imageUrls: string[];
        currency: string;
      }>
    >("/api/v1/catalog/provider/items");
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.categoryId ?? "all",
      priceMinor: item.pricePerDayMinor,
      status: item.active === false ? "Inactive" : "Active",
      stock: item.quantityAvailable,
      image: photoUrl(item.imageUrls?.[0] ?? ""),
      currency: item.currency,
    }));
  },

  async createListing(payload: {
    name: string;
    categoryId: string;
    description: string;
    pricePerDayMinor: number;
    quantityAvailable: number;
    securityDepositMinor?: number;
  }): Promise<{ id: string }> {
    return request<{ id: string }>("/api/v1/catalog/items", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        currency: "ETB",
      }),
    });
  },

  async getListingPhotos(itemId: string, signal?: AbortSignal, kind: "items" | "setups" = "items") {
    return parsePhotos(await request(`/api/v1/catalog/${kind}/${encodeURIComponent(itemId)}/images`, { signal }));
  },
  async getListing(itemId: string, signal?: AbortSignal) {
    return parseListingDetail(await request(`/api/v1/catalog/items/${encodeURIComponent(itemId)}`, { signal }));
  },
  getListingCategories: (signal?: AbortSignal) => request<Array<{ id: string; name: string }>>("/api/v1/catalog/categories", { signal }),
  async editListing(itemId: string, payload: ListingEdit) {
    return parseListingDetail(await request(`/api/v1/catalog/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: JSON.stringify(payload) }));
  },
  async uploadListingPhoto(itemId: string, file: File, kind: "items" | "setups" = "items") {
    const body = new FormData(); body.set("file", file);
    return request(`/api/v1/catalog/${kind}/${encodeURIComponent(itemId)}/images`, { method: "POST", body });
  },
  deleteListingPhoto: (itemId: string, id: string, kind: "items" | "setups" = "items") => request(`/api/v1/catalog/${kind}/${encodeURIComponent(itemId)}/images/${encodeURIComponent(id)}`, { method: "DELETE" }),
  async orderListingPhotos(itemId: string, imageIds: string[], kind: "items" | "setups" = "items") {
    return parsePhotos(await request(`/api/v1/catalog/${kind}/${encodeURIComponent(itemId)}/images/order`, { method: "PUT", body: JSON.stringify({ imageIds }) }));
  },
  archiveListing: (itemId: string, expectedRevision: number) => request(`/api/v1/catalog/items/${encodeURIComponent(itemId)}/archive`, { method: "POST", body: JSON.stringify({ expectedRevision }) }),
  getSetups: () => request<Array<{id:string;name:string;description:string;pricePerDayMinor:number;active:boolean;imageUrl:string}>>("/api/v1/catalog/provider/setups"),
  createSetup: (payload: {name:string;description:string;categoryId:string;pricePerDayMinor:number}) => request<{id:string}>("/api/v1/catalog/provider/setups",{method:"POST",body:JSON.stringify(payload)}),

  async getOrders(signal?: AbortSignal): Promise<Order[]> {
    return parseOrders(await request("/api/v1/bookings", { signal }));
  },

  async updateOrderStatus(bookingId: string, status: OrderTarget): Promise<void> {
    await request(`/api/v1/bookings/${encodeURIComponent(bookingId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  async getOrderChanges(bookingId: string) {
    return parseOrderChanges(await request(`/api/v1/bookings/${encodeURIComponent(bookingId)}/change-requests`));
  },
  resolveOrderChange: (bookingId: string, requestId: string, approved: boolean, note: string) =>
    request(`/api/v1/bookings/${encodeURIComponent(bookingId)}/change-requests/${encodeURIComponent(requestId)}/resolve`, {
      method: "POST", body: JSON.stringify({ approved, note }),
    }),

  async getWallet() {
    const wallet = await request<{ balanceMinor: number; currency: string }>(
      "/api/v1/wallet/me"
    );
    const transactions = await request<
      Array<{
        id: string;
        type: string;
        direction: string;
        amountMinor: number;
        createdAt: string;
      }>
    >("/api/v1/wallet/transactions");
    return { wallet, transactions };
  },

  async payout(amountMinor: number): Promise<void> {
    await request("/api/v1/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amountMinor }),
    });
  },

  // ── Storefront (public profile customers see in the app) ──────────────
  getStorefront: () => request<Storefront>("/api/v1/catalog/storefronts/me"),
  saveStorefront: (body: StorefrontDetails) =>
    request<Storefront>("/api/v1/catalog/storefronts/me", { method: "PUT", body: JSON.stringify(body) }),
  uploadBrandImage(slot: "logo" | "cover", file: File) {
    const body = new FormData(); body.set("file", file);
    return request<Storefront>(`/api/v1/catalog/storefronts/me/${slot}`, { method: "POST", body });
  },
  removeBrandImage: (slot: "logo" | "cover") =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/${slot}`, { method: "DELETE" }),
  addPortfolio: (entry: PortfolioInput) =>
    request<Storefront>("/api/v1/catalog/storefronts/me/portfolio", { method: "POST", body: JSON.stringify(entry) }),
  updatePortfolio: (id: string, entry: PortfolioInput) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/portfolio/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(entry) }),
  deletePortfolio: (id: string) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/portfolio/${encodeURIComponent(id)}`, { method: "DELETE" }),
  uploadPortfolioPhoto(id: string, file: File) {
    const body = new FormData(); body.set("file", file);
    return request<Storefront>(`/api/v1/catalog/storefronts/me/portfolio/${encodeURIComponent(id)}/photos`, { method: "POST", body });
  },
  deletePortfolioPhoto: (id: string, photoId: string) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/portfolio/${encodeURIComponent(id)}/photos/${encodeURIComponent(photoId)}`, { method: "DELETE" }),
  addTeamMember: (member: TeamInput) =>
    request<Storefront>("/api/v1/catalog/storefronts/me/team", { method: "POST", body: JSON.stringify(member) }),
  updateTeamMember: (id: string, member: TeamInput) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/team/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(member) }),
  deleteTeamMember: (id: string) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/team/${encodeURIComponent(id)}`, { method: "DELETE" }),
  uploadTeamPhoto(id: string, file: File) {
    const body = new FormData(); body.set("file", file);
    return request<Storefront>(`/api/v1/catalog/storefronts/me/team/${encodeURIComponent(id)}/photo`, { method: "POST", body });
  },
  removeTeamPhoto: (id: string) =>
    request<Storefront>(`/api/v1/catalog/storefronts/me/team/${encodeURIComponent(id)}/photo`, { method: "DELETE" }),
  async getProviderProfile() {
    return request<{
      providerId: string;
      businessName: string;
      location: string;
      verificationStatus: string;
      bio: string;
    }>("/api/v1/providers/me");
  },
};
export type BookingAnalytics={startDate:string;endDate:string;asOf:string;daily:{date:string;bookings:number;completed:number;closed:number;bookedValueMinor:string}[];topItems:{itemId:string;units:string;bookedUnitDays:string}[]};
export type EarningsAnalytics={startDate:string;endDate:string;asOf:string;currency:string;daily:{date:string;releasedMinor:string}[]};
export type Dispute={id:string;booking_id:string;status:string;reason:string;resolution:string|null};

export type KycDocument = { id: string; type: string; contentType: string; sizeBytes: number; sha256: string; createdAt: string; submitted: boolean };
export type KycSummary = { verificationStatus: string; currentSubmissionId: string | null; submissionStatus: string | null; requiredDocumentTypes: string[]; uploadsAvailable: boolean; maxFileBytes: number; maxDocumentsPerSubmission: number; maxStoredDocuments: number };
export type KycSubmission = { id: string; providerId: string; status: string; businessName: string; location: string; bio: string; createdAt: string; reviewedBy: string | null; reviewedAt: string | null; reviewReason: string | null; documents: KycDocument[] };
export type ProviderProfile = { providerId: string; businessName: string; location: string; verificationStatus: string; bio: string };

export type Offering = "RENTALS" | "SERVICES" | "PACKAGES";
export type StorefrontDetails = {
  tagline: string;
  foundedYear: number | null;
  serviceAreas: string[];
  languages: string[];
  offerings: Offering[];
};
export type PortfolioEntry = { id: string; title: string; eventDate: string | null; description: string; photos: string[] };
export type TeamMember = { id: string; name: string; role: string; bio: string; lead: boolean; photoUrl: string | null };
export type Storefront = StorefrontDetails & {
  providerId: string;
  logoUrl: string | null;
  coverUrl: string | null;
  portfolio: PortfolioEntry[];
  team: TeamMember[];
  rentalCount: number;
  packageCount: number;
};
export type PortfolioInput = { title: string; eventDate: string | null; description: string };
export type TeamInput = { name: string; role: string; bio: string; lead: boolean };
