"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Field, FormError, controlClass } from "@/components/shell/fields";

type Mode = "login" | "signup" | "forgot" | "reset";
const link = "font-medium text-primary underline-offset-4 hover:underline";

export default function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [phone, setPhone] = useState("");
  async function run(work: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    void run(async () => {
      if (mode === "login") {
        const session = await api.auth("login", { email: field("email"), password: data.get("password") }) as { role?: string };
        // Team members land on their own work; business owners on the dashboard.
        window.location.assign(session?.role === "TEAM" ? "/my-work" : "/dashboard");
      } else if (mode === "signup") {
        if (verifiedPhone !== phone) throw new Error("Verify this phone number first.");
        await api.auth("register", { fullName: field("fullName"), email: field("email"), phone, password: data.get("password"), role: "PROVIDER" });
        window.location.assign("/verification");
      } else if (mode === "forgot") {
        const result = await api.auth("password/forgot", { identity: field("email") });
        setMessage(result.message ?? "If this account exists, password reset instructions will be sent.");
      } else {
        const token = field("token") || new URLSearchParams(window.location.search).get("token");
        if (!token) throw new Error("Enter the reset token from your reset instructions.");
        await api.auth("password/reset/confirm", { token, newPassword: data.get("password") });
        setMessage("Password changed. You can now sign in.");
      }
    });
  }
  const title = { login: "Welcome back", signup: "Create your provider account", forgot: "Reset your password", reset: "Choose a new password" }[mode];
  const subtitle = { login: "Sign in to manage your business.", signup: "Then complete your business verification.",
    forgot: "We'll send reset instructions to your email.", reset: "Follow your reset instructions to recover access." }[mode];
  const phoneVerified = mode === "signup" && verifiedPhone !== "" && verifiedPhone === phone;

  return <div className="space-y-6">
    <div className="space-y-1.5">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4">
        {mode === "signup" && <>
          <Field label="Full name"><input name="fullName" autoComplete="name" className={controlClass} required maxLength={200} /></Field>
          <Field label="Phone number" hint={phoneVerified ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="size-3.5" />Phone verified</span> : undefined}>
            <div className="flex gap-2">
              <input type="tel" name="phone" autoComplete="tel" className={controlClass} required placeholder="+251…" value={phone}
                onChange={e => { setPhone(e.target.value); setVerifiedPhone(""); setOtpSent(false); }} />
              {!phoneVerified && <Button type="button" variant="outline" className="shrink-0" onClick={() => void run(async () => {
                if (!phone.trim()) throw new Error("Enter your phone number."); await api.auth("otp/send", { phone }); setOtpSent(true); setMessage("Verification code requested. Check your phone.");
              })}>{otpSent ? "Resend code" : "Send verification code"}</Button>}
            </div>
          </Field>
          {otpSent && !phoneVerified && <div className="flex items-end gap-2 rounded-lg bg-muted/60 p-3">
            <Field label="Verification code" className="flex-1"><input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className={`${controlClass} tracking-[0.4em]`} /></Field>
            <Button type="button" onClick={event => {
              const code = new FormData(event.currentTarget.form!).get("otp");
              void run(async () => { await api.auth("otp/verify", { phone, code }); setVerifiedPhone(phone); setMessage("Phone verified. Complete your account details below."); });
            }}>Verify phone</Button>
          </div>}
        </>}
        {mode !== "reset" && <Field label="Email address"><input name="email" type="email" autoComplete="email" className={controlClass} required placeholder="you@business.com" /></Field>}
        {mode === "reset" && <Field label="Reset token (if not included in your link)"><input name="token" autoComplete="off" className={controlClass} /></Field>}
        {mode !== "forgot" && <Field label={mode === "login" ? <span className="flex justify-between">Password<Link className={`${link} text-xs font-normal`} href="/auth/forgot-password">Forgot password?</Link></span> : "Password"}
          hint={mode === "login" ? undefined : "At least 8 characters."}>
          <input name="password" type="password" aria-label="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} className={controlClass} required />
        </Field>}
        {error && <FormError>{error}</FormError>}
        {message && <p role="status" className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">{message}</p>}
        <Button className="w-full" size="lg" disabled={mode === "signup" && !phoneVerified}>
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
