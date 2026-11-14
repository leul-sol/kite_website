import Link from "next/link";
import { CalendarCheck, MessageSquare, ShieldCheck, Wallet } from "lucide-react";
import { getT } from "@/i18n/server";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";

const POINTS = [
  { icon: CalendarCheck, key: "auth.point1" },
  { icon: MessageSquare, key: "auth.point2" },
  { icon: Wallet, key: "auth.point3" },
  { icon: ShieldCheck, key: "auth.point4" },
] as const;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return <div className="grid min-h-dvh bg-background lg:grid-cols-2">
    <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
      <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />
      <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
        <img src="/kite-mark.png" alt="" className="size-8 rounded-lg bg-white/90 p-1" />Kite <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">{t("brand.forProviders")}</span>
      </Link>
      <div className="relative my-auto max-w-md space-y-8">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">{t("auth.headline")}</h1>
        <ul className="space-y-4">
          {POINTS.map(({ icon: Icon, key }) => <li key={key} className="flex items-center gap-3 text-primary-foreground/90">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10"><Icon className="size-4" /></span>{t(key)}
          </li>)}
        </ul>
      </div>
      <p className="relative text-sm text-primary-foreground/70">{t("auth.privacy")}</p>
    </aside>
    <main className="relative flex flex-col items-center justify-center px-4 py-10 sm:px-8">
      <LanguageSwitch className="absolute right-4 top-4" />
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold lg:hidden">
        <img src="/kite-mark.png" alt="" className="size-8" />Kite
      </Link>
      <div className="w-full max-w-sm fade-in">{children}</div>
    </main>
  </div>;
}
