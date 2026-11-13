"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Camera, CheckCircle2, Clock, Mail, MoreHorizontal, Pencil, Plus, Send, ShieldOff, Star, Trash2, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { api, type TeamAccess, type TeamInput, type TeamMember } from "@/services/api";
import { photoUrl } from "@/services/listing-photos";
import { parseSkills } from "@/services/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const ACCESS: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Can sign in", tone: "bg-success/10 text-success", icon: <CheckCircle2 className="size-3" /> },
  INVITED: { label: "Invitation sent", tone: "bg-primary/10 text-primary", icon: <Mail className="size-3" /> },
  EXPIRED: { label: "Invitation expired", tone: "bg-warning/10 text-warning", icon: <Clock className="size-3" /> },
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(), [access, setAccess] = useState<Record<string, TeamAccess>>({});
  const [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<TeamMember | "new" | null>(null);
  const [inviteLink, setInviteLink] = useState<{ name: string; url: string } | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [members, signIns] = await Promise.all([api.getTeam(), api.getTeamAccess().catch(() => [] as TeamAccess[])]);
      setTeam(members); setAccess(Object.fromEntries(signIns.map(a => [a.memberId, a])));
    } catch (cause) { setError((cause as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, work: () => Promise<unknown>, done?: string) {
    setBusy(id); setError("");
    try { await work(); if (done) toast.success(done); await load(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(null); }
  }

  const invite = (member: TeamMember) => act(member.id, async () => {
    const result = await api.inviteTeamMember(member.id);
    if (result.devInviteUrl) setInviteLink({ name: member.name, url: result.devInviteUrl });
    else toast.success(`Invitation emailed to ${result.email}`);
  });

  const input = (m: TeamMember, changes: Partial<TeamInput>): TeamInput =>
    ({ name: m.name, role: m.role, bio: m.bio, lead: m.lead, ...changes });

  return <div className="fade-in space-y-6">
    <PageHeader title="Team" description="The people who work your events. Invite them to sign in and see their own bookings, and choose who customers see on your storefront."
      actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" />Add person</Button>} />
    {error && <FormError>{error}</FormError>}
    {!team && !error && <div className="grid gap-4 md:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-44" />)}</div>}
    {team?.length === 0 && <EmptyState icon={<Users className="size-5" />} title="No team members yet"
      description="Add the people who decorate, cater, photograph or deliver for you. You can invite them by email so they see their own schedule."
      action={<Button onClick={() => setEditing("new")}><Plus className="size-4" />Add your first person</Button>} />}

    {team && team.length > 0 && <ul className="grid gap-4 md:grid-cols-2">
      {team.map(m => {
        const signIn = access[m.id], state = signIn ? ACCESS[signIn.status] : null, working = busy === m.id;
        return <li key={m.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <label className="group relative grid size-14 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary" title="Change photo">
              {m.photoUrl ? <img src={photoUrl(m.photoUrl)} alt={m.name} className="size-full object-cover" /> : m.name.slice(0, 1).toUpperCase()}
              <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100"><Camera className="size-4" /></span>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={working} aria-label={`Photo for ${m.name}`}
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void act(m.id, () => api.uploadTeamPhoto(m.id, f), "Photo updated"); }} />
            </label>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium">{m.name}{m.lead && <Badge variant="secondary" className="gap-1"><Star className="size-3" />Lead</Badge>}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="size-3" />{m.email || "No email yet"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${m.name}`} disabled={working}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(m)}><Pencil className="size-4" />Edit details</DropdownMenuItem>
                {signIn?.status !== "ACTIVE" && <DropdownMenuItem disabled={!m.email} onSelect={() => void invite(m)}><Send className="size-4" />{signIn ? "Resend invitation" : "Invite to sign in"}</DropdownMenuItem>}
                {signIn && <DropdownMenuItem onSelect={() => { if (confirm(`Remove ${m.name}'s sign-in access? They are signed out straight away.`)) void act(m.id, () => api.revokeTeamAccess(m.id), "Sign-in access removed"); }}>
                  <ShieldOff className="size-4" />Remove sign-in access</DropdownMenuItem>}
                {m.photoUrl && <DropdownMenuItem onSelect={() => void act(m.id, () => api.removeTeamPhoto(m.id), "Photo removed")}><Camera className="size-4" />Remove photo</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => { if (confirm(`Remove ${m.name} from your team? Their sign-in and schedule assignments end.`)) void act(m.id, () => api.deleteTeamMember(m.id), `${m.name} removed`); }}>
                  <Trash2 className="size-4" />Remove from team</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {m.skills && m.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{m.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            {state ? <Badge variant="outline" className={cn("gap-1 border-transparent", state.tone)}>{state.icon}{state.label}</Badge>
              : <Button size="sm" variant="outline" disabled={working || !m.email} title={m.email ? undefined : "Add an email first"} onClick={() => void invite(m)}>
                <Send className="size-3.5" />Invite to sign in</Button>}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={m.onStorefront !== false} disabled={working} aria-label={`Show ${m.name} on storefront`}
                onCheckedChange={on => void act(m.id, () => api.updateTeamMember(m.id, input(m, { onStorefront: on })), on ? "Shown on storefront" : "Hidden from storefront")} />
              On storefront
            </label>
          </div>
        </li>;
      })}
    </ul>}
    <p className="text-xs text-muted-foreground">Team members who sign in see only the bookings you assign them on the <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/staff">Schedule</Link>, and can add handover notes. They never see payments, customers' details or your settings.</p>

    {editing && <MemberDialog member={editing === "new" ? null : editing} onClose={() => setEditing(null)}
      onSaved={async (member, sendInvite) => { setEditing(null); await load(); if (sendInvite && member) await invite(member); }} />}
    {inviteLink && <Dialog open onOpenChange={open => { if (!open) setInviteLink(null); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Invitation link for {inviteLink.name}</DialogTitle>
          <DialogDescription>Email isn&apos;t set up on this server, so send this link yourself. It works once and expires in 7 days.</DialogDescription></DialogHeader>
        <input readOnly className={controlClass} value={inviteLink.url} onFocus={e => e.currentTarget.select()} />
        <DialogFooter><Button onClick={() => { void navigator.clipboard?.writeText(inviteLink.url); toast.success("Link copied"); }}>Copy link</Button></DialogFooter>
      </DialogContent>
    </Dialog>}
  </div>;
}

function MemberDialog({ member, onClose, onSaved }: {
  member: TeamMember | null; onClose: () => void; onSaved: (member: TeamMember | null, sendInvite: boolean) => void;
}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [lead, setLead] = useState(member?.lead ?? false), [shown, setShown] = useState(member?.onStorefront ?? true);
  const [email, setEmail] = useState(member?.email ?? ""), [sendInvite, setSendInvite] = useState(!member);

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{member ? `Edit ${member.name}` : "Add a person"}</DialogTitle>
        <DialogDescription>Email is private. It is only used to invite them to sign in.</DialogDescription></DialogHeader>
      <form id="member" className="grid gap-4" onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const input: TeamInput = { name: String(form.get("name")).trim(), role: String(form.get("role")).trim(), bio: String(form.get("bio") ?? ""),
          lead, email: email.trim(), onStorefront: shown };
        const skills = parseSkills(String(form.get("skills") ?? ""));
        setBusy(true); setError("");
        try {
          const roster = member ? await api.updateTeamMember(member.id, input) : await api.addTeamMember(input);
          const saved = member ? roster.find(m => m.id === member.id) : roster.find(m => m.name === input.name && (m.email ?? "") === input.email?.toLowerCase());
          if (saved && skills.join(",") !== (saved.skills ?? []).join(",")) await api.setTeamSkills(saved.id, skills);
          toast.success(member ? "Details saved" : `${input.name} added to your team`);
          onSaved(saved ?? null, !member && sendInvite && !!input.email);
        } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
      }}>
        {error && <FormError>{error}</FormError>}
        <fieldset disabled={busy} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input name="name" required maxLength={120} defaultValue={member?.name} className={controlClass} /></Field>
            <Field label="Role"><input name="role" required maxLength={120} defaultValue={member?.role} placeholder="Lead decorator" className={controlClass} /></Field>
          </div>
          <Field label="Email" hint={member?.email && email.trim().toLowerCase() !== member.email ? "Changing the email removes their current sign-in. Invite them again afterwards." : undefined}>
            <input type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={controlClass} />
          </Field>
          <Field label="Skills" hint="Only you see these. Separate with commas."><input name="skills" defaultValue={member?.skills?.join(", ")} placeholder="Photography, Driving" className={controlClass} /></Field>
          <Field label="Short bio (shown to customers)"><textarea name="bio" maxLength={500} defaultValue={member?.bio} className={cn(controlClass, "h-auto min-h-16 py-2")} /></Field>
          <div className="grid gap-3 rounded-lg bg-muted/50 p-3 text-sm">
            <label className="flex items-center justify-between gap-3"><span><UserRound className="mr-1.5 inline size-4" />Show on my storefront</span><Switch checked={shown} onCheckedChange={setShown} /></label>
            <label className="flex items-center justify-between gap-3"><span><Star className="mr-1.5 inline size-4" />Team lead</span><Switch checked={lead} onCheckedChange={setLead} /></label>
            {!member && <label className="flex items-center justify-between gap-3"><span><Send className="mr-1.5 inline size-4" />Email them a sign-in invitation</span>
              <Switch checked={sendInvite && !!email.trim()} disabled={!email.trim()} onCheckedChange={setSendInvite} /></label>}
          </div>
        </fieldset>
      </form>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" form="member" disabled={busy}>{busy ? "Saving…" : member ? "Save" : "Add person"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
