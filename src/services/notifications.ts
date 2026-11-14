/** A notification as the portal shows it. Text arrives already written by the server. */
export type PortalNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Where clicking it goes in the portal, if anywhere. */
  href: string | null;
};

/**
 * Notifications link to app screens (e.g. /provider/bookings/<id>). This maps
 * them to the matching portal page; anything unknown stays unlinked.
 */
export function portalLink(link: unknown): string | null {
  if (typeof link !== "string" || !link.startsWith("/") || link.includes("..")) return null;
  const id = (prefix: string) => {
    const rest = link.slice(prefix.length);
    return /^[A-Za-z0-9-]{1,64}$/.test(rest) ? rest : null;
  };
  if (link.startsWith("/provider/bookings/")) {
    const booking = id("/provider/bookings/");
    return booking ? `/orders?booking=${booking}` : "/orders";
  }
  if (link.startsWith("/messages/")) {
    const conversation = id("/messages/");
    return conversation ? `/messages?c=${conversation}` : "/messages";
  }
  if (link === "/wallet") return "/wallet";
  if (link === "/provider/verification") return "/verification";
  if (link === "/team-work") return "/my-work";
  return null;
}

export function parseNotifications(rows: unknown): PortalNotification[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap(row => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string") return [];
    return [{
      id: r.id,
      type: typeof r.type === "string" ? r.type : "general",
      title: typeof r.title === "string" ? r.title : "Notification",
      body: typeof r.body === "string" ? r.body : "",
      read: r.read === true,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
      href: portalLink(r.link),
    }];
  });
}

/** "Just now", "5m ago", "3h ago", "2d ago", then the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const NOTIFICATIONS_PAGE = 20;
