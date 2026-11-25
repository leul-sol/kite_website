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
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/translate";

const ACCESS: Record<string, { label: MessageKey; tone: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "team.access.ACTIVE", tone: "bg-success/10 text-success", icon: <CheckCircle2 className="size-3" /> },
  INVITED: { label: "team.access.INVITED", tone: "bg-primary/10 text-primary", icon: <Mail className="size-3" /> },
  EXPIRED: { label: "team.access.EXPIRED", tone: "bg-warning/10 text-warning", icon: <Clock className="size-3" /> },
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(), [access, setAccess] = useState<Record<string, TeamAccess>>({});
  const [error, setError] = useState(""), [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<TeamMember | "new" | null>(null);
  const [inviteLink, setInviteLink] = useState<{ name: string; url: string } | null>(null);
  const { t, err } = useT();

  const load = useCallback(async () => {
    setError("");
    try {
      const [members, signIns] = await Promise.all([api.getTeam(), api.getTeamAccess().catch(() => [] as TeamAccess[])]);
      setTeam(members); setAccess(Object.fromEntries(signIns.map(a => [a.memberId, a])));
    } catch (cause) { setError(err(cause, "common.tryAgain")); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, work: () => Promise<unknown>, done?: string) {
    setBusy(id); setError("");
    try { await work(); if (done) toast.success(done); await load(); }
    catch (cause) { setError(err(cause, "common.tryAgain")); }
    finally { setBusy(null); }
  }

  const invite = (member: TeamMember) => act(member.id, async () => {
    const result = await api.inviteTeamMember(member.id);
    if (result.devInviteUrl) setInviteLink({ name: member.name, url: result.devInviteUrl });
    else toast.success(t("team.emailed", { email: result.email }));
  });

  const input = (m: TeamMember, changes: Partial<TeamInput>): TeamInput =>
    ({ name: m.name, role: m.role, bio: m.bio, lead: m.lead, ...changes });

  return <div className="fade-in space-y-6">
    <PageHeader title={t("nav.team")} description={t("team.description")}
      actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" />{t("team.add")}</Button>} />
    {error && <FormError>{error}</FormError>}
    {!team && !error && <div className="grid gap-4 md:grid-cols-2">{[0, 1].map(i => <Skeleton key={i} className="h-44" />)}</div>}
    {team?.length === 0 && <EmptyState icon={<Users className="size-5" />} title={t("asg.none")}
      description={t("team.emptyText")}
      action={<Button onClick={() => setEditing("new")}><Plus className="size-4" />{t("team.addFirst")}</Button>} />}

    {team && team.length > 0 && <ul className="grid gap-4 md:grid-cols-2">
      {team.map(m => {
        const signIn = access[m.id], state = signIn ? ACCESS[signIn.status] : null, working = busy === m.id;
        return <li key={m.id} className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <label className="group relative grid size-14 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary" title={t("team.changePhoto")}>
              {m.photoUrl ? <img src={photoUrl(m.photoUrl)} alt={m.name} className="size-full object-cover" /> : m.name.slice(0, 1).toUpperCase()}
              <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100"><Camera className="size-4" /></span>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={working} aria-label={t("team.photoFor", { name: m.name })}
                onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void act(m.id, () => api.uploadTeamPhoto(m.id, f), t("team.photoUpdated")); }} />
            </label>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium">{m.name}{m.lead && <Badge variant="secondary" className="gap-1"><Star className="size-3" />{t("team.lead")}</Badge>}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="size-3" />{m.email || t("team.noEmail")}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t("team.actionsFor", { name: m.name })} disabled={working}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditing(m)}><Pencil className="size-4" />{t("team.edit")}</DropdownMenuItem>
                {signIn?.status !== "ACTIVE" && <DropdownMenuItem disabled={!m.email} onSelect={() => void invite(m)}><Send className="size-4" />{signIn ? t("team.resend") : t("team.invite")}</DropdownMenuItem>}
                {signIn && <DropdownMenuItem onSelect={() => { if (confirm(t("team.revokeConfirm", { name: m.name }))) void act(m.id, () => api.revokeTeamAccess(m.id), t("team.revoked")); }}>
                  <ShieldOff className="size-4" />{t("team.revoke")}</DropdownMenuItem>}
                {m.photoUrl && <DropdownMenuItem onSelect={() => void act(m.id, () => api.removeTeamPhoto(m.id), t("team.photoRemoved"))}><Camera className="size-4" />{t("team.removePhoto")}</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => { if (confirm(t("team.removeConfirm", { name: m.name }))) void act(m.id, () => api.deleteTeamMember(m.id), t("team.removedName", { name: m.name })); }}>
                  <Trash2 className="size-4" />{t("team.remove")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {m.skills && m.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{m.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            {state ? <Badge variant="outline" className={cn("gap-1 border-transparent", state.tone)}>{state.icon}{t(state.label)}</Badge>
              : <Button size="sm" variant="outline" disabled={working || !m.email} title={m.email ? undefined : t("team.addEmailFirst")} onClick={() => void invite(m)}>
                <Send className="size-3.5" />{t("team.invite")}</Button>}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={m.onStorefront !== false} disabled={working} aria-label={t("team.showOn", { name: m.name })}
                onCheckedChange={on => void act(m.id, () => api.updateTeamMember(m.id, input(m, { onStorefront: on })), on ? t("team.shown") : t("team.hidden"))} />
              {t("team.onStorefront")}
            </label>
          </div>
        </li>;
      })}
    </ul>}
    <p className="text-xs text-muted-foreground">{t("team.footerBefore")} <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/staff">{t("team.footerLink")}</Link>{t("team.footerAfter")}</p>

    {editing && <MemberDialog member={editing === "new" ? null : editing} onClose={() => setEditing(null)}
      onSaved={async (member, sendInvite) => { setEditing(null); await load(); if (sendInvite && member) await invite(member); }} />}
    {inviteLink && <Dialog open onOpenChange={open => { if (!open) setInviteLink(null); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t("team.inviteLinkFor", { name: inviteLink.name })}</DialogTitle>
          <DialogDescription>{t("team.inviteLinkText")}</DialogDescription></DialogHeader>
        <input readOnly className={controlClass} value={inviteLink.url} onFocus={e => e.currentTarget.select()} />
        <DialogFooter><Button onClick={() => { void navigator.clipboard?.writeText(inviteLink.url); toast.success(t("team.copied")); }}>{t("team.copy")}</Button></DialogFooter>
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
  const { t, err } = useT();

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{member ? t("team.editName", { name: member.name }) : t("team.addTitle")}</DialogTitle>
        <DialogDescription>{t("team.emailPrivate")}</DialogDescription></DialogHeader>
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
          toast.success(member ? t("team.saved") : t("team.added", { name: input.name }));
          onSaved(saved ?? null, !member && sendInvite && !!input.email);
        } catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setBusy(false); }
      }}>
        {error && <FormError>{error}</FormError>}
        <fieldset disabled={busy} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("common.name")}><input name="name" required maxLength={120} defaultValue={member?.name} className={controlClass} /></Field>
            <Field label={t("team.role")}><input name="role" required maxLength={120} defaultValue={member?.role} placeholder={t("team.rolePlaceholder")} className={controlClass} /></Field>
          </div>
          <Field label={t("common.email")} hint={member?.email && email.trim().toLowerCase() !== member.email ? t("team.emailChange") : undefined}>
            <input type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={controlClass} />
          </Field>
          <Field label={t("team.skills")} hint={t("team.skillsHint")}><input name="skills" defaultValue={member?.skills?.join(", ")} placeholder={t("team.skillsPlaceholder")} className={controlClass} /></Field>
          <Field label={t("team.bio")}><textarea name="bio" maxLength={500} defaultValue={member?.bio} className={cn(controlClass, "h-auto min-h-16 py-2")} /></Field>
          <div className="grid gap-3 rounded-lg bg-muted/50 p-3 text-sm">
            <label className="flex items-center justify-between gap-3"><span><UserRound className="mr-1.5 inline size-4" />{t("team.showMine")}</span><Switch checked={shown} onCheckedChange={setShown} /></label>
            <label className="flex items-center justify-between gap-3"><span><Star className="mr-1.5 inline size-4" />{t("team.teamLead")}</span><Switch checked={lead} onCheckedChange={setLead} /></label>
            {!member && <label className="flex items-center justify-between gap-3"><span><Send className="mr-1.5 inline size-4" />{t("team.emailInvite")}</span>
              <Switch checked={sendInvite && !!email.trim()} disabled={!email.trim()} onCheckedChange={setSendInvite} /></label>}
          </div>
        </fieldset>
      </form>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" form="member" disabled={busy}>{busy ? t("common.saving") : member ? t("common.save") : t("team.add")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
