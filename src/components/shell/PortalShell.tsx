"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronRight, Menu, MessageSquare, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KiteBrand, SidebarBody } from "./AppSidebar";
import { NAV, navItemFor } from "./nav";
import { useProviderShell } from "./useProviderShell";
import { NotificationsBell } from "./NotificationsBell";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={dark ? "Use light theme" : "Use dark theme"} onClick={() => setTheme(dark ? "light" : "dark")}>
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{dark ? "Light theme" : "Dark theme"}</TooltipContent>
  </Tooltip>;
}

const COLLAPSED_KEY = "kite-sidebar-collapsed";

/** Remembers, per browser, whether the desktop sidebar is collapsed to icons. */
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1"); } catch { /* storage blocked */ }
  }, []);
  const toggle = () => setCollapsed(value => {
    try { localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1"); } catch { /* storage blocked */ }
    return !value;
  });
  return [collapsed, toggle] as const;
}

/**
 * The portal frame: the sidebar sits on a soft background, and each page lives
 * in a raised, rounded panel with its own top bar. On phones the panel fills the
 * screen and the sidebar slides out.
 */
export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, unread } = useProviderShell();
  const [open, setOpen] = useState(false);
  const [collapsed, toggle] = useCollapsed();
  const current = navItemFor(pathname);
  const group = current && NAV.find(g => g.items.includes(current));

  return <div className="min-h-screen bg-sidebar">
    <aside className={cn("fixed inset-y-0 left-0 z-30 hidden px-3 py-4 transition-[width] duration-200 lg:block",
      collapsed ? "w-[76px]" : "w-64")}>
      <SidebarBody profile={profile} unread={unread} collapsed={collapsed} onToggle={toggle} />
    </aside>

    <div className={cn("transition-[padding] duration-200 lg:py-3 lg:pr-3", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
      {/* On desktop the panel scrolls on its own, so its rounded edges and top bar stay put. */}
      <div className="flex min-h-screen flex-col bg-background lg:h-[calc(100vh-1.5rem)] lg:min-h-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:shadow-sm">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6 lg:h-16">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar px-3 py-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarBody profile={profile} unread={unread} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <KiteBrand className="lg:hidden" />
          <nav aria-label="You are here" className="hidden min-w-0 items-center gap-1.5 lg:flex">
            {group && <><span className="text-sm text-muted-foreground">{group.label}</span>
              <ChevronRight aria-hidden className="size-3.5 text-muted-foreground/70" /></>}
            <span className="truncate text-base font-semibold">{current?.label ?? "Kite"}</span>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="relative" aria-label={unread ? `Messages, ${unread} unread` : "Messages"}>
                  <Link href="/messages">
                    <MessageSquare className="size-4" />
                    {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-highlight ring-2 ring-background" />}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Messages</TooltipContent>
            </Tooltip>
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  </div>;
}
