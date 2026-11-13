"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, LogOut, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { signOut, type ShellProfile } from "./useProviderShell";

export function KiteBrand({ className, href = "/dashboard", label = "Provider" }: { className?: string; href?: string; label?: string }) {
  return <Link href={href} className={cn("flex items-center gap-2.5 px-2", className)}>
    <Image src="/kite-mark.png" alt="" width={30} height={30} className="size-7 object-contain" priority />
    <span className="text-lg font-semibold tracking-tight">Kite</span>
    <Badge variant="secondary" className="rounded-full px-2 text-[10px] font-medium uppercase tracking-wide">{label}</Badge>
  </Link>;
}

/** Navigation plus the account card. Used in the desktop sidebar and the mobile sheet. */
export function SidebarBody({ profile, unread, onNavigate }: {
  profile: ShellProfile; unread: number; onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const verified = profile?.verificationStatus === "VERIFIED";

  async function logout() {
    setBusy(true);
    try { await signOut(); }
    catch { toast.error("Sign out failed. Try again."); setBusy(false); }
  }

  return <div className="flex h-full flex-col gap-6">
    <KiteBrand />
    <nav aria-label="Portal" className="flex-1 space-y-6 overflow-y-auto">
      {NAV.map(group => <div key={group.label} className="space-y-1">
        <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{group.label}</p>
        {group.items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}>
            <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="flex-1">{item.label}</span>
            {item.href === "/messages" && unread > 0 &&
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">{unread > 99 ? "99+" : unread}</Badge>}
          </Link>;
        })}
      </div>)}
    </nav>

    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(profile?.businessName || "K").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile?.businessName || "Your business"}</p>
          <Link href="/verification" onClick={onNavigate} className={cn("flex items-center gap-1 text-xs", verified ? "text-success" : "text-muted-foreground hover:text-foreground")}>
            {verified ? <BadgeCheck className="size-3.5" /> : <ShieldQuestion className="size-3.5" />}
            {verified ? "Verified business" : "Not verified yet"}
          </Link>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={logout} disabled={busy} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Sign out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>;
}
