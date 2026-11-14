"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiteBrand } from "./AppSidebar";
import { ThemeToggle } from "./PortalShell";
import { signOut } from "./useProviderShell";
import { NotificationsBell } from "./NotificationsBell";
import { useT } from "@/i18n/I18nProvider";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";

/** A deliberately small shell for team members: their work, in the same raised panel as the portal. */
export default function TeamShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  return <div className="min-h-screen bg-sidebar sm:p-3">
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-background sm:min-h-[calc(100vh-1.5rem)] sm:rounded-2xl sm:border sm:shadow-sm">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur sm:h-16 sm:rounded-t-2xl sm:px-6">
        <KiteBrand href="/my-work" label={t("brand.team")} />
        <div className="ml-auto flex items-center gap-1">
          <NotificationsBell />
          <LanguageSwitch compact />
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="size-4" />{t("common.signOut")}</Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  </div>;
}
