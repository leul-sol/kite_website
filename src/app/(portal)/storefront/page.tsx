"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type Offering, type PortfolioEntry, type Storefront, type TeamMember } from "@/services/api";
import { photoUrl } from "@/services/listing-photos";
import ops from "../operations.module.css";
import styles from "./storefront.module.css";

const OFFERINGS: { id: Offering; label: string; hint: string }[] = [
  { id: "RENTALS", label: "Rentals", hint: "Decor, furniture and equipment people rent" },
  { id: "SERVICES", label: "Services", hint: "Work you do, like decorating, catering or photography" },
  { id: "PACKAGES", label: "Packages", hint: "Complete setups that bundle items and services" },
];

const list = (value: string) => value.split(",").map(v => v.trim()).filter(Boolean);
const photoId = (url: string) => url.split("/").at(-2) ?? "";

export default function StorefrontPage() {
  const [store, setStore] = useState<Storefront>();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.getProviderProfile>>>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
    setBusy(true); setError(""); setMessage("");
    try { setStore(await action()); setMessage(done); return true; }
    catch (cause) { setError((cause as Error).message); return false; }
    finally { setBusy(false); }
  }

  if (!store) return <div className={ops.page}>
    <h1 className="h1">Storefront</h1>
    {error ? <><p role="alert">{error}</p><button className="btn-secondary" onClick={() => void load()}>Try again</button></> : <p role="status">Loading storefront…</p>}
  </div>;

  return <div className={`${ops.page} fade-in`}>
    <header>
      <h1 className="h1">Storefront</h1>
      <p className="text-body">This is what customers see about your business in the Kite app. Contact details are never shown. Customers book and message you through Kite.</p>
    </header>
    <div aria-live="polite">
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {message && <p role="status" className={styles.ok}>{message}</p>}
    </div>

    <Branding store={store} name={profile?.businessName ?? ""} busy={busy} run={run} />
    <Identity profile={profile} />
    <Details store={store} busy={busy} run={run} />
    <Portfolio entries={store.portfolio} busy={busy} run={run} />
    <Team members={store.team} busy={busy} run={run} />
  </div>;
}

type Run = (action: () => Promise<Storefront>, done: string) => Promise<boolean>;

function ImagePicker({ label, busy, onPick }: { label: string; busy: boolean; onPick: (file: File) => void }) {
  return <label className={`btn-secondary ${styles.fileButton}`} aria-disabled={busy}>
    {label}
    <input type="file" accept="image/png,image/jpeg" disabled={busy} className={styles.hiddenInput}
      onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) onPick(file); }} />
  </label>;
}

function Branding({ store, name, busy, run }: { store: Storefront; name: string; busy: boolean; run: Run }) {
  const [tagline, setTagline] = useState(store.tagline);
  return <section className={`glass-card ${styles.card}`}>
    <h2 className={styles.title}>Branding</h2>
    <div className={styles.cover} style={store.coverUrl ? { backgroundImage: `url(${photoUrl(store.coverUrl)})` } : undefined}>
      {!store.coverUrl && <span className="text-small">No cover photo. A wide photo of your best setup works well (1600×600).</span>}
      <div className={styles.logo}>
        {store.logoUrl ? <img src={photoUrl(store.logoUrl)} alt="Logo" /> : <span>{name.slice(0, 1).toUpperCase() || "?"}</span>}
      </div>
    </div>
    <div className={styles.row}>
      <ImagePicker label={store.logoUrl ? "Replace logo" : "Upload logo"} busy={busy} onPick={f => void run(() => api.uploadBrandImage("logo", f), "Logo updated.")} />
      {store.logoUrl && <button className="btn-secondary" disabled={busy} onClick={() => void run(() => api.removeBrandImage("logo"), "Logo removed.")}>Remove logo</button>}
      <ImagePicker label={store.coverUrl ? "Replace cover" : "Upload cover"} busy={busy} onPick={f => void run(() => api.uploadBrandImage("cover", f), "Cover photo updated.")} />
      {store.coverUrl && <button className="btn-secondary" disabled={busy} onClick={() => void run(() => api.removeBrandImage("cover"), "Cover photo removed.")}>Remove cover</button>}
    </div>
    <p className="text-small">PNG or JPEG up to 2 MB. Photos are cleaned of hidden location data before they are published.</p>
    <form className={styles.inline} onSubmit={e => { e.preventDefault(); void run(() => api.saveStorefront({ ...details(store), tagline }), "Tagline saved."); }}>
      <label>Tagline<input maxLength={160} placeholder="e.g. Elegant wedding decor across Addis Ababa" value={tagline} onChange={e => setTagline(e.target.value)} /></label>
      <button className="btn-primary" disabled={busy || tagline === store.tagline}>Save tagline</button>
    </form>
  </section>;
}

function Identity({ profile }: { profile?: Awaited<ReturnType<typeof api.getProviderProfile>> }) {
  if (!profile) return null;
  const verified = profile.verificationStatus === "VERIFIED";
  return <section className={`glass-card ${styles.card}`}>
    <h2 className={styles.title}>Business identity</h2>
    <dl className={styles.facts}>
      <div><dt>Business name</dt><dd>{profile.businessName || "Not set"}</dd></div>
      <div><dt>Location</dt><dd>{profile.location || "Not set"}</dd></div>
      <div><dt>Verification</dt><dd>{verified ? "Verified. Customers see a verified badge." : "Not verified yet. Customers see this too."}</dd></div>
    </dl>
    <p className="text-small">Your name, location, about text and verification are managed on <Link href="/verification">Business verification</Link>, because changes to them can require a new review.</p>
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
  return <section className={`glass-card ${styles.card}`}>
    <h2 className={styles.title}>What you offer</h2>
    <form onSubmit={e => {
      e.preventDefault();
      void run(() => api.saveStorefront({
        ...details(store), offerings, foundedYear: founded ? Number(founded) : null,
        serviceAreas: list(areas), languages: list(languages),
      }), "Business details saved.");
    }}>
      <fieldset className={styles.choices}>
        <legend>Choose everything that applies</legend>
        {OFFERINGS.map(o => <label key={o.id} className={styles.choice}>
          <input type="checkbox" checked={offerings.includes(o.id)}
            onChange={e => setOfferings(e.target.checked ? [...offerings, o.id] : offerings.filter(x => x !== o.id))} />
          <span><strong>{o.label}</strong><small>{o.hint}</small></span>
        </label>)}
      </fieldset>
      <div className={styles.grid}>
        <label>Year founded<input type="number" min={1900} max={year} placeholder={String(year - 5)} value={founded} onChange={e => setFounded(e.target.value)} /></label>
        <label>Areas you serve<input placeholder="Bole, Kazanchis, Old Airport" value={areas} onChange={e => setAreas(e.target.value)} /><small className="text-small">Separate with commas, up to 10.</small></label>
        <label>Languages<input placeholder="Amharic, English" value={languages} onChange={e => setLanguages(e.target.value)} /><small className="text-small">Separate with commas, up to 8.</small></label>
      </div>
      <button className="btn-primary" disabled={busy}>Save details</button>
    </form>
  </section>;
}

function Portfolio({ entries, busy, run }: { entries: PortfolioEntry[]; busy: boolean; run: Run }) {
  const empty = { title: "", eventDate: "", description: "" };
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState(empty);
  const input = (d: typeof empty) => ({ title: d.title, eventDate: d.eventDate || null, description: d.description });
  return <section className={`glass-card ${styles.card}`}>
    <h2 className={styles.title}>Past work</h2>
    <p className="text-small">Show events you have done. Add a title, date and up to 8 photos for each one. Real photos of your own work build the most trust.</p>
    {entries.length === 0 && <p className="text-small">No past work yet.</p>}
    <ul className={styles.list}>
      {entries.map(entry => <li key={entry.id} className={styles.entry}>
        {editing === entry.id ? <form onSubmit={async e => { e.preventDefault(); if (await run(() => api.updatePortfolio(entry.id, input(edit)), "Work updated.")) setEditing(null); }}>
          <WorkFields value={edit} onChange={setEdit} />
          <div className={styles.row}><button className="btn-primary" disabled={busy}>Save</button><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button></div>
        </form> : <>
          <div className={styles.entryHead}>
            <div><h3>{entry.title}</h3>{entry.eventDate && <p className="text-small">{new Date(entry.eventDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>}</div>
            <div className={styles.row}>
              <button className="btn-secondary" disabled={busy} onClick={() => { setEditing(entry.id); setEdit({ title: entry.title, eventDate: entry.eventDate ?? "", description: entry.description }); }}>Edit</button>
              <button className="btn-secondary" disabled={busy} onClick={() => { if (confirm(`Delete "${entry.title}" and its photos?`)) void run(() => api.deletePortfolio(entry.id), "Work deleted."); }}>Delete</button>
            </div>
          </div>
          {entry.description && <p className="text-body">{entry.description}</p>}
          <div className={styles.photos}>
            {entry.photos.map(url => <figure key={url}>
              <img src={photoUrl(url)} alt={`${entry.title} photo`} />
              <button className={styles.remove} aria-label="Remove photo" disabled={busy} onClick={() => void run(() => api.deletePortfolioPhoto(entry.id, photoId(url)), "Photo removed.")}>×</button>
            </figure>)}
            {entry.photos.length < 8 && <ImagePicker label="+ Add photo" busy={busy} onPick={f => void run(() => api.uploadPortfolioPhoto(entry.id, f), "Photo added.")} />}
          </div>
        </>}
      </li>)}
    </ul>
    {entries.length < 30 && <form className={styles.add} onSubmit={async e => { e.preventDefault(); if (await run(() => api.addPortfolio(input(draft)), "Work added. Now add photos.")) setDraft(empty); }}>
      <h3>Add past work</h3>
      <WorkFields value={draft} onChange={setDraft} />
      <button className="btn-primary" disabled={busy || !draft.title.trim()}>Add work</button>
    </form>}
  </section>;
}

function WorkFields({ value, onChange }: { value: { title: string; eventDate: string; description: string }; onChange: (v: { title: string; eventDate: string; description: string }) => void }) {
  return <div className={styles.grid}>
    <label>Title<input required maxLength={120} placeholder="Garden wedding for 300 guests" value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} /></label>
    <label>Event date<input type="date" value={value.eventDate} onChange={e => onChange({ ...value, eventDate: e.target.value })} /></label>
    <label className={styles.wide}>Description<textarea maxLength={2000} placeholder="What you provided and how it came together" value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} /></label>
  </div>;
}

function Team({ members, busy, run }: { members: TeamMember[]; busy: boolean; run: Run }) {
  const empty = { name: "", role: "", bio: "", lead: false };
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState(empty);
  return <section className={`glass-card ${styles.card}`}>
    <h2 className={styles.title}>Team</h2>
    <p className="text-small">Introduce the people behind your business. Mark one person as the lead. Names, roles and photos are shown to customers; contact details are not.</p>
    {members.length === 0 && <p className="text-small">No team members yet.</p>}
    <ul className={styles.team}>
      {members.map(m => <li key={m.id} className={styles.member}>
        {editing === m.id ? <form onSubmit={async e => { e.preventDefault(); if (await run(() => api.updateTeamMember(m.id, edit), "Team member updated.")) setEditing(null); }}>
          <MemberFields value={edit} onChange={setEdit} />
          <div className={styles.row}><button className="btn-primary" disabled={busy}>Save</button><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button></div>
        </form> : <>
          <div className={styles.avatar}>{m.photoUrl ? <img src={photoUrl(m.photoUrl)} alt={m.name} /> : <span>{m.name.slice(0, 1).toUpperCase()}</span>}</div>
          <div className={styles.memberText}>
            <strong>{m.name}</strong>{m.lead && <span className={styles.badge}>Lead</span>}
            <p className="text-small">{m.role}</p>
            {m.bio && <p className="text-small">{m.bio}</p>}
          </div>
          <div className={styles.row}>
            <ImagePicker label={m.photoUrl ? "Replace photo" : "Add photo"} busy={busy} onPick={f => void run(() => api.uploadTeamPhoto(m.id, f), "Photo updated.")} />
            {m.photoUrl && <button className="btn-secondary" disabled={busy} onClick={() => void run(() => api.removeTeamPhoto(m.id), "Photo removed.")}>Remove photo</button>}
            <button className="btn-secondary" disabled={busy} onClick={() => { setEditing(m.id); setEdit({ name: m.name, role: m.role, bio: m.bio, lead: m.lead }); }}>Edit</button>
            <button className="btn-secondary" disabled={busy} onClick={() => { if (confirm(`Remove ${m.name} from your team?`)) void run(() => api.deleteTeamMember(m.id), "Team member removed."); }}>Remove</button>
          </div>
        </>}
      </li>)}
    </ul>
    {members.length < 30 && <form className={styles.add} onSubmit={async e => { e.preventDefault(); if (await run(() => api.addTeamMember(draft), "Team member added.")) setDraft(empty); }}>
      <h3>Add team member</h3>
      <MemberFields value={draft} onChange={setDraft} />
      <button className="btn-primary" disabled={busy || !draft.name.trim() || !draft.role.trim()}>Add member</button>
    </form>}
  </section>;
}

function MemberFields({ value, onChange }: { value: { name: string; role: string; bio: string; lead: boolean }; onChange: (v: { name: string; role: string; bio: string; lead: boolean }) => void }) {
  return <div className={styles.grid}>
    <label>Name<input required maxLength={120} value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} /></label>
    <label>Role<input required maxLength={120} placeholder="Lead decorator" value={value.role} onChange={e => onChange({ ...value, role: e.target.value })} /></label>
    <label className={styles.wide}>Short bio<textarea maxLength={500} value={value.bio} onChange={e => onChange({ ...value, bio: e.target.value })} /></label>
    <label className={styles.check}><input type="checkbox" checked={value.lead} onChange={e => onChange({ ...value, lead: e.target.checked })} />Team lead</label>
  </div>;
}
