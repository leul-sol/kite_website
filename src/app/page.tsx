import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarCheck, Camera, LayoutGrid, MessageSquare, Package, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Package, title: "Rentals, services or both", text: "List chairs and decor by the day, or photography and catering by the hour, event or guest." },
  { icon: CalendarCheck, title: "A simple booking board", text: "See new requests, confirm them, start rentals and complete them when items come back." },
  { icon: MessageSquare, title: "Chat before they book", text: "Answer questions in Kite. Phone numbers and links are hidden so nobody goes around you." },
  { icon: Wallet, title: "Payments held safely", text: "Customers pay up front. Your earnings are released to your Kite wallet after the event." },
  { icon: Camera, title: "A storefront that sells", text: "Logo, cover photo, past work and your team, all in one profile customers can trust." },
  { icon: BadgeCheck, title: "Verified badge", text: "Submit your business documents privately and earn a badge customers look for." },
];

const STEPS = [
  { title: "Create your account", text: "Sign up with your email and verify your phone." },
  { title: "Add your listings", text: "Photos, prices and how many you can take on each day." },
  { title: "Get booked", text: "Confirm requests and get paid through Kite." },
];

export default function LandingPage() {
  return <div className="min-h-dvh bg-background">
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img src="/kite-mark.png" alt="" className="size-7" />Kite
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">for Providers</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/auth/login">Sign in</Link></Button>
          <Button asChild size="sm"><Link href="/auth/signup">Get started</Link></Button>
        </nav>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div className="fade-in space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <Sparkles className="size-3.5 text-primary" />For event rental and service businesses
            </span>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Get booked for weddings, birthdays and every <span className="text-primary">celebration</span>.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">Kite brings customers to your rentals and services. You manage listings, bookings, messages and earnings from one simple portal.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/auth/signup">Become a provider<ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/auth/login">Sign in to your portal</Link></Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Free to join. Your contact details stay private.</p>
          </div>

          <div aria-hidden className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            <div className="rounded-2xl border bg-card p-4 shadow-xl">
              <div className="mb-4 flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-destructive/60" /><span className="size-2.5 rounded-full bg-warning/70" /><span className="size-2.5 rounded-full bg-success/60" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-primary p-4 text-primary-foreground"><p className="text-xs opacity-80">Available balance</p><p className="mt-1 text-xl font-semibold">ETB 24,500</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Awaiting confirmation</p><p className="mt-1 text-xl font-semibold">3</p></div>
              </div>
              <div className="mt-3 space-y-2">
                {[["Gold Chiavari Chairs", "Confirmed", "bg-primary/10 text-primary"], ["Event Photography", "New request", "bg-warning/10 text-warning"], ["Traditional Catering", "Completed", "bg-success/10 text-success"]].map(([name, status, tone]) =>
                  <div key={name} className="flex items-center gap-3 rounded-xl border p-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted"><LayoutGrid className="size-4 text-muted-foreground" /></span>
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{status}</span>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need to run your business</h2>
            <p className="mt-3 text-muted-foreground">Whether you rent things, provide a service, or both.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => <div key={title} className="group rounded-xl border bg-card p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-5" /></span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">Start in three steps</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => <li key={step.title} className="relative rounded-xl border bg-card p-6 shadow-xs">
            <span className="mb-4 grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
          </li>)}
        </ol>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white/5" />
          <h2 className="relative text-3xl font-semibold tracking-tight">Ready to get your first booking?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/80">Set up your storefront today. It takes about ten minutes.</p>
          <Button asChild size="lg" variant="secondary" className="relative mt-8"><Link href="/auth/signup">Create provider account<ArrowRight className="size-4" /></Link></Button>
        </div>
      </section>
    </main>

    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <span className="flex items-center gap-2"><img src="/kite-mark.png" alt="" className="size-5" />© {new Date().getFullYear()} Kite</span>
        <span>Customers book in the Kite app. Providers manage everything here.</span>
      </div>
    </footer>
  </div>;
}
