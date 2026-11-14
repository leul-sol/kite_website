"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, ChevronsUpDown, LogOut, PanelLeft, ShieldQuestion, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { signOut, type ShellProfile } from "./useProviderShell";

export function KiteBrand({ className, href = "/dashboard", label = "Provider", compact = false }: {
  className?: string; href?: string; label?: string; compact?: boolean;
}) {
  return <Link href={href} className={cn("flex min-w-0 items-center gap-2.5 px-2", className)} aria-label={compact ? "Kite home" : undefined}>
    <Image src="/kite-mark.png" alt="" width={30} height={30} className="size-7 shrink-0 object-contain" priority />
    {!compact && <>
      <span className="text-lg font-semibold tracking-tight">Kite</span>
      <Badge variant="secondary" className="rounded-full px-2 text-[10px] font-medium uppercase tracking-wide">{label}</Badge>
    </>}
  </Link>;
}

/** Shows a label next to an item when the sidebar is collapsed to icons. */
function Hint({ show, label, children }: { show: boolean; label: string; children: React.ReactElement }) {
  if (!show) return children;
  return <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>;
}

/**
 * Brand, navigation and the account menu. Sits straight on the shell background;
 * the active page is a raised white pill. Used in the desktop sidebar and the phone menu.
 */
export function SidebarBody({ profile, unread, onNavigate, collapsed = false, onToggle }: {
  profile: ShellProfile; unread: number; onNavigate?: () => void;
  /** Icons only (desktop). */
  collapsed?: boolean;
  /** Shows the collapse button when given. */
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const verified = profile?.verificationStatus === "VERIFIED";
  const name = profile?.businessName || "Your business";

  async function logout() {
    setBusy(true);
    try { await signOut(); }
    catch { toast.error("Sign out failed. Try again."); setBusy(false); }
  }

  return <div className="flex h-full flex-col gap-5">
    <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
      <KiteBrand compact={collapsed} />
      {onToggle && <Hint show label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
          <PanelLeft className="size-4" />
        </Button>
      </Hint>}
    </div>

    <nav aria-label="Portal" className="no-scrollbar -mx-1 flex-1 space-y-5 overflow-y-auto px-1 py-1">
      {NAV.map(group => <div key={group.label} className="space-y-1">
        {collapsed
          ? <div aria-hidden className="mx-auto my-2 h-px w-6 bg-border first:hidden" />
          : <p className="px-3 pb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{group.label}</p>}
        {group.items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const showUnread = item.href === "/messages" && unread > 0;
          return <Hint key={item.href} show={collapsed} label={item.label}>
            <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg text-sm transition-colors duration-150",
                collapsed ? "mx-auto size-10 justify-center" : "px-3 py-2",
                active
                  ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                  : "font-medium text-sidebar-foreground hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.07]",
              )}>
              <item.icon className={cn("size-[18px] shrink-0 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {showUnread && (collapsed
                ? <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-highlight ring-2 ring-sidebar" />
                : <Badge className={cn("h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]", active && "bg-primary-foreground text-primary")}>{unread > 99 ? "99+" : unread}</Badge>)}
            </Link>
          </Hint>;
        })}
      </div>)}
    </nav>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Account: ${name}`}
          className={cn("flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]",
            collapsed ? "justify-center p-1.5" : "p-2")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className={cn("flex items-center gap-1 truncate text-xs", verified ? "text-success" : "text-muted-foreground")}>
                {verified ? <BadgeCheck className="size-3.5 shrink-0" /> : <ShieldQuestion className="size-3.5 shrink-0" />}
                {verified ? "Verified business" : "Not verified yet"}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className="w-60">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/storefront" onClick={onNavigate}><Store className="size-4" />Storefront</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/verification" onClick={onNavigate}><BadgeCheck className="size-4" />Verification</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()} disabled={busy} variant="destructive">
          <LogOut className="size-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}
