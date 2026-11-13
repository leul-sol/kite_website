"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { api, type Invitation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FormError, controlClass } from "@/components/shell/fields";

function AcceptInvite() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invitation>(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => {
    if (!/^[0-9a-f]{64}$/.test(token)) { setError("This invitation link is incomplete. Open the link from your email again."); return; }
    api.describeInvitation(token).then(setInvite).catch(cause => setError((cause as Error).message));
  }, [token]);

  if (joined) return <div className="space-y-4 text-center">
    <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-6" /></div>
    <h2 className="text-2xl font-semibold tracking-tight">You&apos;re on the team</h2>
    <p className="text-sm text-muted-foreground">Sign in with {joined} to see the bookings you&apos;re working on.</p>
    <Button asChild className="w-full" size="lg"><Link href="/auth/login">Sign in</Link></Button>
  </div>;

  return <div className="space-y-6">
    <div className="space-y-1.5">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Users className="size-5" /></div>
      <h2 className="text-2xl font-semibold tracking-tight">{invite ? `Join ${invite.businessName}` : "Team invitation"}</h2>
      <p className="text-sm text-muted-foreground">{invite ? `${invite.businessName} added you, ${invite.memberName}, to their team on Kite. Choose a password to sign in.` : "Checking your invitation…"}</p>
    </div>
    {error && <FormError>{error}</FormError>}
    {!invite && !error && <Skeleton className="h-40" />}
    {invite && <form className="grid gap-4" onSubmit={async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget), password = String(form.get("password")), confirm = String(form.get("confirm"));
      if (password !== confirm) { setError("The passwords don't match."); return; }
      setBusy(true); setError("");
      try { setJoined((await api.acceptInvitation(token, password)).email); }
      catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="grid gap-4">
        <Field label="Email"><input className={controlClass} value={invite.email} readOnly /></Field>
        <Field label="Password" hint="At least 8 characters."><input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={controlClass} /></Field>
        <Field label="Confirm password"><input name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={controlClass} /></Field>
        <Button size="lg" className="w-full">{busy ? "Joining…" : "Join the team"}</Button>
      </fieldset>
      <p className="text-center text-xs text-muted-foreground">This link expires on {new Date(invite.expiresAt).toLocaleDateString(undefined, { dateStyle: "long" })}.</p>
    </form>}
  </div>;
}

export default function AcceptInvitePage() {
  return <Suspense fallback={<Skeleton className="h-64" />}><AcceptInvite /></Suspense>;
}
