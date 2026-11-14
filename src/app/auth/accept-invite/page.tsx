"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { api, type Invitation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import PhoneVerify from "@/components/auth/PhoneVerify";
import { useT } from "@/i18n/I18nProvider";

function AcceptInvite() {
  const token = useSearchParams().get("token") ?? "";
  const { t, date } = useT();
  const [invite, setInvite] = useState<Invitation>(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!/^[0-9a-f]{64}$/.test(token)) { setError(t("invite.incomplete")); return; }
    api.describeInvitation(token).then(setInvite).catch(cause => setError((cause as Error).message));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (joined) return <div className="space-y-4 text-center">
    <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-6" /></div>
    <h2 className="text-2xl font-semibold tracking-tight">{t("invite.onTeam")}</h2>
    <p className="text-sm text-muted-foreground">{t(phone ? "invite.signInWithPhone" : "invite.signInWith", { email: joined })}</p>
    <Button asChild className="w-full" size="lg"><Link href="/auth/login">{t("common.signIn")}</Link></Button>
  </div>;

  return <div className="space-y-6">
    <div className="space-y-1.5">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Users className="size-5" /></div>
      <h2 className="text-2xl font-semibold tracking-tight">{invite ? t("invite.join", { business: invite.businessName }) : t("invite.title")}</h2>
      <p className="text-sm text-muted-foreground">{invite ? t("invite.text", { business: invite.businessName, name: invite.memberName }) : t("invite.checking")}</p>
    </div>
    {error && <FormError>{error}</FormError>}
    {!invite && !error && <Skeleton className="h-40" />}
    {invite && <form className="grid gap-4" onSubmit={async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget), password = String(form.get("password")), confirm = String(form.get("confirm"));
      if (password !== confirm) { setError(t("invite.mismatch")); return; }
      setBusy(true); setError("");
      try { setJoined((await api.acceptInvitation(token, password, phone)).email); }
      catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="grid gap-4">
        <Field label={t("common.email")}><input className={controlClass} value={invite.email} readOnly /></Field>
        <PhoneVerify optional checkTaken onVerified={setPhone} onError={setError} />
        <Field label={t("auth.password")} hint={t("auth.passwordHint")}><input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={controlClass} /></Field>
        <Field label={t("invite.confirm")}><input name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={controlClass} /></Field>
        <Button size="lg" className="w-full">{busy ? t("invite.joining") : t("invite.joinButton")}</Button>
      </fieldset>
      <p className="text-center text-xs text-muted-foreground">{t("invite.expires", { date: date(invite.expiresAt, { dateStyle: "long" }) })}</p>
    </form>}
  </div>;
}

export default function AcceptInvitePage() {
  return <Suspense fallback={<Skeleton className="h-64" />}><AcceptInvite /></Suspense>;
}
