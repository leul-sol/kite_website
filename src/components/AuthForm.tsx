"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import styles from "@/app/auth/auth.module.css";

type Mode = "login" | "signup" | "forgot" | "reset";
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
        await api.auth("login", { email: field("email"), password: data.get("password") });
        window.location.assign("/dashboard");
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
  const title = { login: "Welcome Back", signup: "Join Kite", forgot: "Reset Password", reset: "Choose a new password" }[mode];
  return <div>
    <h2 className="h2">{title}</h2>
    <p className="text-body" style={{ margin: "16px 0 24px" }}>{mode === "signup" ? "Create a provider account, then complete your business verification." : mode === "login" ? "Sign in to manage your business." : "Follow your reset instructions to recover access."}</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
        {mode === "signup" && <>
          <label className={styles.formGroup} style={{ display: "block" }}>Full name<input name="fullName" autoComplete="name" className={styles.input} required maxLength={200} /></label>
          <label className={styles.formGroup} style={{ display: "block" }}>Phone number<input type="tel" name="phone" autoComplete="tel" className={styles.input} required placeholder="+251…" value={phone} onChange={e => { setPhone(e.target.value); setVerifiedPhone(""); setOtpSent(false); }} /></label>
          <button type="button" className="btn-secondary" onClick={() => void run(async () => { if (!phone.trim()) throw new Error("Enter your phone number."); await api.auth("otp/send", { phone }); setOtpSent(true); setMessage("Verification code requested. Check your phone."); })}>Send verification code</button>
          {otpSent && verifiedPhone !== phone && <div style={{ margin: "16px 0" }}>
            <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className={styles.input} /></label>
            <button type="button" className="btn-secondary" onClick={event => {
              const code = new FormData(event.currentTarget.form!).get("otp");
              void run(async () => { await api.auth("otp/verify", { phone, code }); setVerifiedPhone(phone); setMessage("Phone verified. Complete your account details below."); });
            }}>Verify phone</button>
          </div>}
        </>}
        {mode !== "reset" && <label className={styles.formGroup} style={{ display: "block", marginTop: 16 }}>Email address<input name="email" type="email" autoComplete="email" className={styles.input} required /></label>}
        {mode === "reset" && <label className={styles.formGroup} style={{ display: "block" }}>Reset token (if not included in your link)<input name="token" autoComplete="off" className={styles.input} /></label>}
        {mode !== "forgot" && <label className={styles.formGroup} style={{ display: "block" }}>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} className={styles.input} required /></label>}
        <button className="btn-primary" style={{ width: "100%" }} disabled={mode === "signup" && verifiedPhone !== phone}>{busy ? "Please wait…" : mode === "login" ? "Sign In" : mode === "signup" ? "Create provider account" : mode === "forgot" ? "Request reset instructions" : "Save new password"}</button>
      </fieldset>
    </form>
    {error && <p role="alert" style={{ color: "var(--error)", marginTop: 16 }}>{error}</p>}
    {message && <p role="status" style={{ marginTop: 16 }}>{message}</p>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 24 }}>
      {mode !== "login" && <Link className={styles.authLink} href="/auth/login">Sign in</Link>}
      {mode === "login" && <><Link className={styles.authLink} href="/auth/signup">Create provider account</Link><Link className={styles.authLink} href="/auth/forgot-password">Forgot password?</Link></>}
      {mode === "forgot" && <Link className={styles.authLink} href="/auth/reset-password">I have a reset token</Link>}
    </div>
  </div>;
}
