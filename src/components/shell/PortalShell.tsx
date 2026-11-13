"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Menu, MessageSquare, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KiteBrand, SidebarBody } from "./AppSidebar";
import { navItemFor } from "./nav";
import { useProviderShell } from "./useProviderShell";

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

/** Sidebar on desktop, a slide-out menu on phones, and a slim top bar. */
export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, unread } = useProviderShell();
  const [open, setOpen] = useState(false);
  const current = navItemFor(pathname);

  return <div className="min-h-screen bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar px-3 py-5 lg:block">
      <SidebarBody profile={profile} unread={unread} />
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="size-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar px-3 py-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody profile={profile} unread={unread} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <KiteBrand className="lg:hidden" />
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium">{current?.label ?? "Kite"}</p>
          {current && <p className="truncate text-xs text-muted-foreground">{current.description}</p>}
        </div>
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
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  </div>;
}
