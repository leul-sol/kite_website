"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/services/api";
import { NOTIFICATIONS_PAGE, timeAgo, type PortalNotification } from "@/services/notifications";
import { cn } from "@/lib/utils";

/** Header bell: unread count, the latest notifications, and a link to what each is about. */
export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<PortalNotification[]>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const refreshUnread = useCallback(() => api.getUnreadNotifications()
    .then(r => setUnread(r.count)).catch(() => undefined), []);

  useEffect(() => {
    void refreshUnread();
    const timer = setInterval(() => void refreshUnread(), 30_000);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  const load = useCallback(async () => {
    setError("");
    try {
      const page = await api.getNotifications();
      setItems(page);
      setHasMore(page.length >= NOTIFICATIONS_PAGE);
    } catch {
      setError("Couldn't load notifications. Try again.");
    }
  }, []);

  useEffect(() => { if (open) void load(); }, [open, load]);

  async function loadOlder() {
    const last = items?.at(-1)?.createdAt;
    if (!last) return;
    try {
      const older = await api.getNotifications(last);
      setItems(prev => [...(prev ?? []), ...older.filter(n => !prev?.some(p => p.id === n.id))]);
      setHasMore(older.length >= NOTIFICATIONS_PAGE);
    } catch {
      setError("Couldn't load older notifications.");
    }
  }

  async function select(n: PortalNotification) {
    if (!n.read) {
      setItems(prev => prev?.map(p => p.id === n.id ? { ...p, read: true } : p));
      setUnread(count => Math.max(0, count - 1));
      void api.markNotificationRead(n.id).then(refreshUnread).catch(() => undefined);
    }
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  }

  async function markAll() {
    setItems(prev => prev?.map(p => ({ ...p, read: true })));
    setUnread(0);
    await api.markAllNotificationsRead().catch(() => undefined);
    void refreshUnread();
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="relative"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-highlight px-1 text-center text-[10px] font-semibold leading-4 text-white ring-2 ring-background">
          {unread > 99 ? "99+" : unread}
        </span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium">Notifications</p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={!items?.some(n => !n.read)} onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      <div className="no-scrollbar max-h-[min(28rem,70vh)] overflow-y-auto">
        {error && <p role="alert" className="px-4 py-3 text-sm text-destructive">{error}</p>}
        {!items && !error && <p role="status" className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>}
        {items?.length === 0 && <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-muted-foreground">Bookings, payments and team updates will appear here.</p>
        </div>}
        <ul>
          {items?.map(n => <li key={n.id} className="border-b last:border-b-0">
            <button type="button" onClick={() => void select(n)} disabled={n.read && !n.href}
              className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition enabled:hover:bg-accent", !n.read && "bg-primary/5")}>
              <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{n.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </span>
              {n.href && <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />}
            </button>
          </li>)}
        </ul>
        {hasMore && <div className="p-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => void loadOlder()}>Load older</Button>
        </div>}
      </div>
    </PopoverContent>
  </Popover>;
}
