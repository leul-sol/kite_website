"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Camera, ImagePlus, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, type Offering, type PortfolioEntry, type Storefront, type TeamMember } from "@/services/api";
import { photoUrl } from "@/services/listing-photos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const OFFERINGS: { id: Offering; label: string; hint: string }[] = [
  { id: "RENTALS", label: "Rentals", hint: "Decor, furniture and equipment people rent" },
  { id: "SERVICES", label: "Services", hint: "Work you do, like decorating, catering or photography" },
  { id: "PACKAGES", label: "Packages", hint: "Complete setups that bundle items and services" },
];

const list = (value: string) => value.split(",").map(v => v.trim()).filter(Boolean);
const photoId = (url: string) => url.split("/").at(-2) ?? "";
const card = "space-y-4 rounded-xl border bg-card p-5 shadow-xs";
const area = cn(controlClass, "h-auto min-h-20 py-2");
type Profile = Awaited<ReturnType<typeof api.getProviderProfile>>;

export default function StorefrontPage() {
  const [store, setStore] = useState<Storefront>();
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, p] = await Promise.all([api.getStorefront(), api.getProviderProfile()]);
      setStore(s); setProfile(p);
    } catch (cause) { setError((cause as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  /** Runs one change; every storefront call returns the updated storefront. */
  async function run(action: () => Promise<Storefront>, done: string) {
    if (busy) return false;
    setBusy(true); setError("");
    try { setStore(await action()); toast.success(done); return true; }
    catch (cause) { setError((cause as Error).message); return false; }
    finally { setBusy(false); }
  }

  const header = <PageHeader title="Storefront" description="What customers see about your business in the Kite app. Contact details are never shown; customers book and message you through Kite." />;
  if (!store) return <div>{header}
    {error ? <div className="space-y-3"><FormError>{error}</FormError><Button variant="outline" onClick={() => void load()}>Try again</Button></div>
      : <div role="status" className="space-y-4"><span className="sr-only">Loading storefront…</span><Skeleton className="h-56" /><Skeleton className="h-40" /></div>}
  </div>;

  return <div className="fade-in space-y-6">
    {header}
    <div aria-live="polite">{error && <FormError>{error}</FormError>}</div>
    <Branding store={store} profile={profile} busy={busy} run={run} />
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <Details store={store} busy={busy} run={run} />
      <Identity profile={profile} />
    </div>
    <Portfolio entries={store.portfolio} busy={busy} run={run} />
    <Team members={store.team} busy={busy} run={run} />
  </div>;
}

type Run = (action: () => Promise<Storefront>, done: string) => Promise<boolean>;

function ImagePicker({ label, busy, onPick, className, icon = <ImagePlus className="size-3.5" /> }: {
  label: string; busy: boolean; onPick: (file: File) => void; className?: string; icon?: React.ReactNode;
}) {
  return <label aria-disabled={busy} className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50", className)}>
    {icon}{label}
    <input type="file" accept="image/png,image/jpeg" disabled={busy} className="sr-only"
      onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) onPick(file); }} />
  </label>;
}

function Branding({ store, profile, busy, run }: { store: Storefront; profile?: Profile; busy: boolean; run: Run }) {
  const [tagline, setTagline] = useState(store.tagline);
  const name = profile?.businessName ?? "";
  return <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
    <div className="relative h-44 bg-gradient-to-br from-primary/80 to-primary/40 bg-cover bg-center sm:h-56"
      style={store.coverUrl ? { backgroundImage: `url(${photoUrl(store.coverUrl)})` } : undefined}>
      {!store.coverUrl && <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-primary-foreground/90">No cover photo yet. A wide photo of your best setup works well (1600×600).</p>}
      <div className="absolute right-3 top-3 flex gap-2">
        <ImagePicker label={store.coverUrl ? "Replace cover" : "Upload cover"} busy={busy} icon={<Camera className="size-3.5" />} className="bg-background/90 backdrop-blur"
          onPick={f => void run(() => api.uploadBrandImage("cover", f), "Cover photo updated.")} />
        {store.coverUrl && <Button size="sm" variant="outline" className="bg-background/90 backdrop-blur" disabled={busy} onClick={() => void run(() => api.removeBrandImage("cover"), "Cover photo removed.")}>Remove cover</Button>}
      </div>
    </div>
    <div className="px-5 pb-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="-mt-10 grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-muted text-2xl font-semibold text-primary shadow-sm">
          {store.logoUrl ? <img src={photoUrl(store.logoUrl)} alt="Logo" className="size-full object-cover" /> : <span>{name.slice(0, 1).toUpperCase() || "?"}</span>}
        </div>
        <div className="min-w-0 flex-1 pt-3">
          <p className="flex items-center gap-1.5 text-lg font-semibold">{name || "Your business"}{profile?.verificationStatus === "VERIFIED" && <BadgeCheck className="size-5 text-primary" />}</p>
          {profile?.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{profile.location}</p>}
        </div>
        <div className="flex gap-2 pt-3">
          <ImagePicker label={store.logoUrl ? "Replace logo" : "Upload logo"} busy={busy} onPick={f => void run(() => api.uploadBrandImage("logo", f), "Logo updated.")} />
          {store.logoUrl && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => api.removeBrandImage("logo"), "Logo removed.")}>Remove logo</Button>}
        </div>
      </div>
      <form className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); void run(() => api.saveStorefront({ ...details(store), tagline }), "Tagline saved."); }}>
        <Field label="Tagline" className="flex-1"><input className={controlClass} maxLength={160} placeholder="e.g. Elegant wedding decor across Addis Ababa" value={tagline} onChange={e => setTagline(e.target.value)} /></Field>
        <Button disabled={busy || tagline === store.tagline}>Save tagline</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">PNG or JPEG up to 2 MB. Photos are cleaned of hidden location data before they are published.</p>
    </div>
  </section>;
}

function Identity({ profile }: { profile?: Profile }) {
  if (!profile) return null;
  const verified = profile.verificationStatus === "VERIFIED";
  return <section className={card}>
    <h2 className="font-semibold">Business identity</h2>
    <dl className="space-y-3 text-sm">
      <div><dt className="text-xs text-muted-foreground">Business name</dt><dd className="font-medium">{profile.businessName || "Not set"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Location</dt><dd className="font-medium">{profile.location || "Not set"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Verification</dt><dd className={cn("font-medium", verified ? "text-success" : "text-warning")}>{verified ? "Verified. Customers see a verified badge." : "Not verified yet. Customers see this too."}</dd></div>
    </dl>
    <p className="text-xs text-muted-foreground">Name, location, about text and verification are managed on <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/verification">Business verification</Link>, because changes can require a new review.</p>
  </section>;
}

function details(store: Storefront) {
  return { tagline: store.tagline, foundedYear: store.foundedYear, serviceAreas: store.serviceAreas, languages: store.languages, offerings: store.offerings };
}

function Details({ store, busy, run }: { store: Storefront; busy: boolean; run: Run }) {
  const [offerings, setOfferings] = useState<Offering[]>(store.offerings as Offering[]);
  const [founded, setFounded] = useState(store.foundedYear?.toString() ?? "");
  const [areas, setAreas] = useState(store.serviceAreas.join(", "));
  const [languages, setLanguages] = useState(store.languages.join(", "));
  const year = new Date().getFullYear();
  return <section className={card}>
    <h2 className="font-semibold">What you offer</h2>
    <form className="space-y-4" onSubmit={e => {
      e.preventDefault();
      void run(() => api.saveStorefront({
        ...details(store), offerings, foundedYear: founded ? Number(founded) : null,
        serviceAreas: list(areas), languages: list(languages),
      }), "Business details saved.");
    }}>
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="mb-2 text-sm text-muted-foreground">Choose everything that applies</legend>
        {OFFERINGS.map(o => {
          const on = offerings.includes(o.id);
          return <label key={o.id} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3 transition hover:bg-accent", on && "border-primary bg-primary/5 ring-1 ring-primary")}>
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={on}
              onChange={e => setOfferings(e.target.checked ? [...offerings, o.id] : offerings.filter(x => x !== o.id))} />
            <span><strong className="block text-sm">{o.label}</strong><small className="text-xs text-muted-foreground">{o.hint}</small></span>
          </label>;
        })}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Year founded"><input className={controlClass} type="number" min={1900} max={year} placeholder={String(year - 5)} value={founded} onChange={e => setFounded(e.target.value)} /></Field>
        <Field label="Areas you serve" hint="Separate with commas, up to 10."><input className={controlClass} placeholder="Bole, Kazanchis, Old Airport" value={areas} onChange={e => setAreas(e.target.value)} /></Field>
        <Field label="Languages" hint="Separate with commas, up to 8."><input className={controlClass} placeholder="Amharic, English" value={languages} onChange={e => setLanguages(e.target.value)} /></Field>
      </div>
      <div className="flex justify-end"><Button disabled={busy}>Save details</Button></div>
    </form>
  </section>;
}

function Portfolio({ entries, busy, run }: { entries: PortfolioEntry[]; busy: boolean; run: Run }) {
  const empty = { title: "", eventDate: "", description: "" };
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState(empty);
  const input = (d: typeof empty) => ({ title: d.title, eventDate: d.eventDate || null, description: d.description });
  return <section className={card}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="font-semibold">Past work</h2>
        <p className="text-sm text-muted-foreground">Events you have done, with up to 8 photos each. Real photos of your own work build the most trust.</p></div>
      {entries.length < 30 && !adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Add work</Button>}
    </div>
    {adding && <form className="space-y-3 rounded-lg border border-dashed p-4" onSubmit={async e => { e.preventDefault(); if (await run(() => api.addPortfolio(input(draft)), "Work added. Now add photos.")) { setDraft(empty); setAdding(false); } }}>
      <WorkFields value={draft} onChange={setDraft} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button disabled={busy || !draft.title.trim()}>Add work</Button></div>
    </form>}
    {entries.length === 0 && !adding && <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No past work yet.</p>}
    <ul className="space-y-4">
      {entries.map(entry => <li key={entry.id} className="rounded-lg border p-4">
        {editing === entry.id ? <form className="space-y-3" onSubmit={async e => { e.preventDefault(); if (await run(() => api.updatePortfolio(entry.id, input(edit)), "Work updated.")) setEditing(null); }}>
          <WorkFields value={edit} onChange={setEdit} />
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={busy}>Save</Button></div>
        </form> : <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="font-medium">{entry.title}</h3>{entry.eventDate && <p className="text-xs text-muted-foreground">{new Date(entry.eventDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>}</div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Edit" disabled={busy} onClick={() => { setEditing(entry.id); setEdit({ title: entry.title, eventDate: entry.eventDate ?? "", description: entry.description }); }}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Delete" disabled={busy} onClick={() => { if (confirm(`Delete "${entry.title}" and its photos?`)) void run(() => api.deletePortfolio(entry.id), "Work deleted."); }}><Trash2 className="size-4" /></Button>
            </div>
          </div>
          {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {entry.photos.map(url => <figure key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img src={photoUrl(url)} alt={`${entry.title} photo`} className="size-full object-cover" />
              <button aria-label="Remove photo" disabled={busy} onClick={() => void run(() => api.deletePortfolioPhoto(entry.id, photoId(url)), "Photo removed.")}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"><X className="size-3.5" /></button>
            </figure>)}
            {entry.photos.length < 8 && <ImagePicker label="Add photo" busy={busy} onPick={f => void run(() => api.uploadPortfolioPhoto(entry.id, f), "Photo added.")}
              className="aspect-square h-auto flex-col justify-center border-dashed text-xs text-muted-foreground shadow-none" />}
          </div>
        </div>}
      </li>)}
    </ul>
  </section>;
}

function WorkFields({ value, onChange }: { value: { title: string; eventDate: string; description: string }; onChange: (v: { title: string; eventDate: string; description: string }) => void }) {
  return <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
    <Field label="Title"><input className={controlClass} required maxLength={120} placeholder="Garden wedding for 300 guests" value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></Field>
    <Field label="Event date"><input className={controlClass} type="date" value={value.eventDate} onChange={e => onChange({ ...value, eventDate: e.target.value })} /></Field>
    <Field label="Description" className="sm:col-span-2"><textarea className={area} maxLength={2000} placeholder="What you provided and how it came together" value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} /></Field>
  </div>;
}

function Team({ members, busy, run }: { members: TeamMember[]; busy: boolean; run: Run }) {
  const empty = { name: "", role: "", bio: "", lead: false };
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState(empty);
  return <section className={card}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">The people behind your business. Names, roles and photos are shown to customers; contact details are not.</p></div>
      {members.length < 30 && !adding && <Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Add member</Button>}
    </div>
    {adding && <form className="space-y-3 rounded-lg border border-dashed p-4" onSubmit={async e => { e.preventDefault(); if (await run(() => api.addTeamMember(draft), "Team member added.")) { setDraft(empty); setAdding(false); } }}>
      <MemberFields value={draft} onChange={setDraft} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button disabled={busy || !draft.name.trim() || !draft.role.trim()}>Add member</Button></div>
    </form>}
    {members.length === 0 && !adding && <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No team members yet.</p>}
    <ul className="grid gap-3 md:grid-cols-2">
      {members.map(m => <li key={m.id} className="rounded-lg border p-4">
        {editing === m.id ? <form className="space-y-3" onSubmit={async e => { e.preventDefault(); if (await run(() => api.updateTeamMember(m.id, edit), "Team member updated.")) setEditing(null); }}>
          <MemberFields value={edit} onChange={setEdit} />
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={busy}>Save</Button></div>
        </form> : <div className="flex gap-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {m.photoUrl ? <img src={photoUrl(m.photoUrl)} alt={m.name} className="size-full object-cover" /> : <span>{m.name.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="flex items-center gap-2 font-medium">{m.name}{m.lead && <Badge variant="secondary" className="gap-1"><Star className="size-3" />Lead</Badge>}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
              {m.bio && <p className="mt-1 text-sm">{m.bio}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <ImagePicker label={m.photoUrl ? "Replace photo" : "Add photo"} busy={busy} onPick={f => void run(() => api.uploadTeamPhoto(m.id, f), "Photo updated.")} />
              {m.photoUrl && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => api.removeTeamPhoto(m.id), "Photo removed.")}>Remove photo</Button>}
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditing(m.id); setEdit({ name: m.name, role: m.role, bio: m.bio, lead: m.lead }); }}>Edit</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => { if (confirm(`Remove ${m.name} from your team?`)) void run(() => api.deleteTeamMember(m.id), "Team member removed."); }}>Remove</Button>
            </div>
          </div>
        </div>}
      </li>)}
    </ul>
  </section>;
}

function MemberFields({ value, onChange }: { value: { name: string; role: string; bio: string; lead: boolean }; onChange: (v: { name: string; role: string; bio: string; lead: boolean }) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Name"><input className={controlClass} required maxLength={120} value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} /></Field>
    <Field label="Role"><input className={controlClass} required maxLength={120} placeholder="Lead decorator" value={value.role} onChange={e => onChange({ ...value, role: e.target.value })} /></Field>
    <Field label="Short bio" className="sm:col-span-2"><textarea className={area} maxLength={500} value={value.bio} onChange={e => onChange({ ...value, bio: e.target.value })} /></Field>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={value.lead} onChange={e => onChange({ ...value, lead: e.target.checked })} />Team lead</label>
  </div>;
}
