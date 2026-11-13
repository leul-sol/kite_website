import Link from "next/link";
import { CalendarCheck, MessageSquare, ShieldCheck, Wallet } from "lucide-react";

const POINTS = [
  { icon: CalendarCheck, text: "Confirm bookings and track every rental" },
  { icon: MessageSquare, text: "Answer customers before they book" },
  { icon: Wallet, text: "Get paid into your Kite wallet" },
  { icon: ShieldCheck, text: "Earn a verified badge customers trust" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh bg-background lg:grid-cols-2">
    <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
      <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />
      <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
        <img src="/kite-mark.png" alt="" className="size-8 rounded-lg bg-white/90 p-1" />Kite <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">for Providers</span>
      </Link>
      <div className="relative my-auto max-w-md space-y-8">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">Run your event rental business in one place.</h1>
        <ul className="space-y-4">
          {POINTS.map(({ icon: Icon, text }) => <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10"><Icon className="size-4" /></span>{text}
          </li>)}
        </ul>
      </div>
      <p className="relative text-sm text-primary-foreground/70">Customers book and pay through Kite. Your contact details stay private.</p>
    </aside>
    <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold lg:hidden">
        <img src="/kite-mark.png" alt="" className="size-8" />Kite
      </Link>
      <div className="w-full max-w-sm fade-in">{children}</div>
    </main>
  </div>;
}
