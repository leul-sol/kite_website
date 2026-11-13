"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiteBrand } from "./AppSidebar";
import { ThemeToggle } from "./PortalShell";
import { signOut } from "./useProviderShell";

/** A deliberately small shell for team members: their work, nothing else. */
export default function TeamShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <KiteBrand href="/my-work" label="Team" />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</Button>
      </div>
    </header>
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</main>
  </div>;
}
