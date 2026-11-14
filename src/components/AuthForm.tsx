"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import GoogleButton, { googleSignIn } from "@/components/auth/GoogleButton";
import PhoneVerify from "@/components/auth/PhoneVerify";
import { useT } from "@/i18n/I18nProvider";

type Mode = "login" | "signup" | "forgot" | "reset";
const link = "font-medium text-primary underline-offset-4 hover:underline";
/** Team members land on their own work; business owners on the dashboard. */
const home = (role?: string) => window.location.assign(role === "TEAM" ? "/my-work" : "/dashboard");

export default function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  // A new Google user verifies a phone before the account is created.
  const [googleSignup, setGoogleSignup] = useState<{ signupToken: string; email: string; name: string } | null>(null);

  async function run(work: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : t("common.tryAgain")); }
    finally { setBusy(false); }
  }

  const onGoogle = (idToken: string) => void run(async () => {
    const result = await googleSignIn(idToken);
    if (result.status === "SIGNED_IN") home(result.role);
    else setGoogleSignup(result);
  });

  async function checkEmail(value: string) {
    if (mode !== "signup" || !value.includes("@")) { setEmailTaken(false); return; }
    try {
      const result = await api.auth("identity/check", { email: value }) as { email?: { available: boolean } };
      setEmailTaken(result.email?.available === false);
    } catch { setEmailTaken(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    void run(async () => {
      if (mode === "login") {
        const session = await api.auth("login", { email: field("identity"), password: data.get("password") }) as { role?: string };
        home(session?.role);
      } else if (mode === "signup") {
        if (emailTaken) throw new Error(t("auth.emailTakenError"));
        if (!verifiedPhone) throw new Error(t("auth.verifyPhoneFirst"));
        await api.auth("register", { fullName: field("fullName"), email: field("email"), phone: verifiedPhone, password: data.get("password"), role: "PROVIDER" });
        window.location.assign("/verification");
      } else if (mode === "forgot") {
        const result = await api.auth("password/forgot", { identity: field("identity") });
        setMessage(result.message ?? t("auth.resetSent"));
      } else {
        const token = field("token") || new URLSearchParams(window.location.search).get("token");
        if (!token) throw new Error(t("auth.enterToken"));
        await api.auth("password/reset/confirm", { token, newPassword: data.get("password") });
        setMessage(t("auth.passwordChanged"));
      }
    });
  }

  if (googleSignup) return <div className="space-y-6">
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight">{googleSignup.name ? t("auth.almostThereName", { name: googleSignup.name.split(" ")[0] }) : t("auth.almostThere")}</h2>
      <p className="text-sm text-muted-foreground">{t("auth.googlePhone", { email: googleSignup.email })}</p>
    </div>
    <PhoneVerify checkTaken disabled={busy} onVerified={setVerifiedPhone} onError={setError} />
    {error && <FormError>{error}</FormError>}
    <Button className="w-full" size="lg" disabled={busy || !verifiedPhone} onClick={() => void run(async () => {
      await api.auth("google/complete", { signupToken: googleSignup.signupToken, phone: verifiedPhone });
      window.location.assign("/verification");
    })}>{busy ? t("common.pleaseWait") : t("auth.createAccount")}</Button>
    <p className="text-center text-sm text-muted-foreground"><button className={link} onClick={() => { setGoogleSignup(null); setError(""); }}>{t("common.back")}</button></p>
  </div>;

  const title = t(`auth.${mode}.title`);
  const subtitle = t(`auth.${mode}.subtitle`);

  return <div className="space-y-6">
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {(mode === "login" || mode === "signup") && <GoogleButton onCredential={onGoogle} />}
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4">
        {mode === "signup" && <>
          <Field label={t("auth.fullName")}><input name="fullName" autoComplete="name" className={controlClass} required maxLength={200} /></Field>
          <Field label={t("auth.emailAddress")} hint={emailTaken ? <span className="text-destructive">{t("auth.emailTaken")} <Link className={link} href="/auth/login">{t("auth.signInInstead")}</Link></span> : undefined}>
            <input name="email" type="email" autoComplete="email" className={controlClass} required placeholder="you@business.com"
              onBlur={e => void checkEmail(e.target.value.trim())} onChange={() => emailTaken && setEmailTaken(false)} />
          </Field>
          <PhoneVerify checkTaken disabled={busy} onVerified={setVerifiedPhone} onError={setError} />
        </>}
        {(mode === "login" || mode === "forgot") && <Field label={t("auth.identity")}>
          <input name="identity" autoComplete="username" className={controlClass} required placeholder={t("auth.identityPlaceholder")} />
        </Field>}
        {mode === "reset" && <Field label={t("auth.resetToken")}><input name="token" autoComplete="off" className={controlClass} /></Field>}
        {mode !== "forgot" && <Field label={mode === "login" ? <span className="flex justify-between">{t("auth.password")}<Link className={`${link} text-xs font-normal`} href="/auth/forgot-password">{t("auth.forgotLink")}</Link></span> : t("auth.password")}
          hint={mode === "login" ? undefined : t("auth.passwordHint")}>
          <input name="password" type="password" aria-label={t("auth.password")} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} className={controlClass} required />
        </Field>}
        {error && <FormError>{error}</FormError>}
        {message && <p role="status" className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">{message}</p>}
        <Button className="w-full" size="lg" disabled={mode === "signup" && (!verifiedPhone || emailTaken)}>
          {busy ? t("common.pleaseWait") : mode === "login" ? t("auth.signInButton") : mode === "signup" ? t("auth.createAccount") : mode === "forgot" ? t("auth.requestReset") : t("auth.saveNewPassword")}
        </Button>
      </fieldset>
    </form>
    <p className="text-center text-sm text-muted-foreground">
      {mode === "login" && <>{t("auth.newToKite")} <Link className={link} href="/auth/signup">{t("auth.createAccount")}</Link></>}
      {mode === "signup" && <>{t("auth.haveAccount")} <Link className={link} href="/auth/login">{t("common.signIn")}</Link></>}
      {mode === "forgot" && <><Link className={link} href="/auth/login">{t("common.signIn")}</Link> · <Link className={link} href="/auth/reset-password">{t("auth.haveToken")}</Link></>}
      {mode === "reset" && <Link className={link} href="/auth/login">{t("common.signIn")}</Link>}
    </p>
  </div>;
}
