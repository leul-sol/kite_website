"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import GoogleButton, { googleSignIn } from "@/components/auth/GoogleButton";
import PhoneVerify from "@/components/auth/PhoneVerify";

type Mode = "login" | "signup" | "forgot" | "reset";
const link = "font-medium text-primary underline-offset-4 hover:underline";
/** Team members land on their own work; business owners on the dashboard. */
const home = (role?: string) => window.location.assign(role === "TEAM" ? "/my-work" : "/dashboard");

export default function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  // A new Google user verifies a phone before the account is created.
  const [googleSignup, setGoogleSignup] = useState<{ signupToken: string; email: string; name: string } | null>(null);

  async function run(work: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
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
        if (emailTaken) throw new Error("This email is already registered. Sign in instead.");
        if (!verifiedPhone) throw new Error("Verify your phone number first.");
        await api.auth("register", { fullName: field("fullName"), email: field("email"), phone: verifiedPhone, password: data.get("password"), role: "PROVIDER" });
        window.location.assign("/verification");
      } else if (mode === "forgot") {
        const result = await api.auth("password/forgot", { identity: field("identity") });
        setMessage(result.message ?? "If this account exists, password reset instructions will be sent.");
      } else {
        const token = field("token") || new URLSearchParams(window.location.search).get("token");
        if (!token) throw new Error("Enter the reset token from your reset instructions.");
        await api.auth("password/reset/confirm", { token, newPassword: data.get("password") });
        setMessage("Password changed. You can now sign in.");
      }
    });
  }

  if (googleSignup) return <div className="space-y-6">
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight">Almost there{googleSignup.name ? `, ${googleSignup.name.split(" ")[0]}` : ""}</h2>
      <p className="text-sm text-muted-foreground">Add your phone number to finish creating your provider account for {googleSignup.email}. Every Kite account has a verified phone.</p>
    </div>
    <PhoneVerify checkTaken disabled={busy} onVerified={setVerifiedPhone} onError={setError} />
    {error && <FormError>{error}</FormError>}
    <Button className="w-full" size="lg" disabled={busy || !verifiedPhone} onClick={() => void run(async () => {
      await api.auth("google/complete", { signupToken: googleSignup.signupToken, phone: verifiedPhone });
      window.location.assign("/verification");
    })}>{busy ? "Please wait…" : "Create provider account"}</Button>
    <p className="text-center text-sm text-muted-foreground"><button className={link} onClick={() => { setGoogleSignup(null); setError(""); }}>Back</button></p>
  </div>;

  const title = { login: "Welcome back", signup: "Create your provider account", forgot: "Reset your password", reset: "Choose a new password" }[mode];
  const subtitle = { login: "Sign in to manage your business.", signup: "Then complete your business verification.",
    forgot: "We'll send reset instructions to your email or phone.", reset: "Follow your reset instructions to recover access." }[mode];

  return <div className="space-y-6">
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {(mode === "login" || mode === "signup") && <GoogleButton onCredential={onGoogle} />}
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4">
        {mode === "signup" && <>
          <Field label="Full name"><input name="fullName" autoComplete="name" className={controlClass} required maxLength={200} /></Field>
          <Field label="Email address" hint={emailTaken ? <span className="text-destructive">This email is already registered. <Link className={link} href="/auth/login">Sign in instead</Link></span> : undefined}>
            <input name="email" type="email" autoComplete="email" className={controlClass} required placeholder="you@business.com"
              onBlur={e => void checkEmail(e.target.value.trim())} onChange={() => emailTaken && setEmailTaken(false)} />
          </Field>
          <PhoneVerify checkTaken disabled={busy} onVerified={setVerifiedPhone} onError={setError} />
        </>}
        {(mode === "login" || mode === "forgot") && <Field label="Email or phone">
          <input name="identity" autoComplete="username" className={controlClass} required placeholder="you@business.com or 0911 234 567" />
        </Field>}
        {mode === "reset" && <Field label="Reset token (if not included in your link)"><input name="token" autoComplete="off" className={controlClass} /></Field>}
        {mode !== "forgot" && <Field label={mode === "login" ? <span className="flex justify-between">Password<Link className={`${link} text-xs font-normal`} href="/auth/forgot-password">Forgot password?</Link></span> : "Password"}
          hint={mode === "login" ? undefined : "At least 8 characters."}>
          <input name="password" type="password" aria-label="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} className={controlClass} required />
        </Field>}
        {error && <FormError>{error}</FormError>}
        {message && <p role="status" className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">{message}</p>}
        <Button className="w-full" size="lg" disabled={mode === "signup" && (!verifiedPhone || emailTaken)}>
          {busy ? "Please wait…" : mode === "login" ? "Sign In" : mode === "signup" ? "Create provider account" : mode === "forgot" ? "Request reset instructions" : "Save new password"}
        </Button>
      </fieldset>
    </form>
    <p className="text-center text-sm text-muted-foreground">
      {mode === "login" && <>New to Kite? <Link className={link} href="/auth/signup">Create provider account</Link></>}
      {mode === "signup" && <>Already have an account? <Link className={link} href="/auth/login">Sign in</Link></>}
      {mode === "forgot" && <><Link className={link} href="/auth/login">Sign in</Link> · <Link className={link} href="/auth/reset-password">I have a reset token</Link></>}
      {mode === "reset" && <Link className={link} href="/auth/login">Sign in</Link>}
    </p>
  </div>;
}
