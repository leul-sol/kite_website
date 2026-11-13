"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Field, controlClass } from "@/components/shell/fields";

/**
 * Phone number + one-time code. Accepts local numbers (0911 234 567) or +251…; the backend
 * normalises them. `checkTaken` warns before sending a code if the number already has an account.
 */
export default function PhoneVerify({ label = "Phone number", checkTaken = false, optional = false, disabled, onVerified, onError }: {
  label?: string; checkTaken?: boolean; optional?: boolean; disabled?: boolean;
  onVerified: (phone: string | null) => void; onError: (message: string) => void;
}) {
  const [phone, setPhone] = useState(""), [code, setCode] = useState("");
  const [sent, setSent] = useState(false), [verified, setVerified] = useState(""), [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function step(work: () => Promise<void>) {
    setBusy(true); onError(""); setInfo("");
    try { await work(); } catch (e) { onError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }

  const send = () => step(async () => {
    if (!phone.trim()) throw new Error("Enter your phone number.");
    if (checkTaken) {
      const result = await api.auth("identity/check", { phone }) as { phone?: { available: boolean } };
      if (result.phone && !result.phone.available) throw new Error("This phone number is already registered. Sign in instead, or use another number.");
    }
    const result = await api.auth("otp/send", { phone }) as { phone?: string };
    setSent(true); setInfo(`We sent a 6-digit code to ${result.phone ?? phone}.`);
  });
  const verify = () => step(async () => {
    const result = await api.auth("otp/verify", { phone, code }) as { phone?: string };
    const normalized = result.phone ?? phone;
    setVerified(phone); onVerified(normalized);
  });

  const done = verified !== "" && verified === phone;
  return <div className="grid gap-3">
    <Field label={optional ? `${label} (optional)` : label}
      hint={done ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="size-3.5" />Phone verified</span> : info || "Ethiopian numbers can start with 09 or 07."}>
      <div className="flex gap-2">
        <input type="tel" autoComplete="tel" className={controlClass} placeholder="0911 234 567" value={phone} disabled={disabled || busy}
          onChange={e => { setPhone(e.target.value); setSent(false); setCode(""); if (verified) { setVerified(""); onVerified(null); } }} />
        {!done && <Button type="button" variant="outline" className="shrink-0" disabled={disabled || busy || !phone.trim()} onClick={() => void send()}>
          {sent ? "Resend code" : "Send code"}</Button>}
      </div>
    </Field>
    {sent && !done && <div className="flex items-end gap-2 rounded-lg bg-muted/60 p-3">
      <Field label="Verification code" className="flex-1">
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} disabled={busy}
          onChange={e => setCode(e.target.value.replace(/\D/g, ""))} className={`${controlClass} tracking-[0.4em]`} />
      </Field>
      <Button type="button" disabled={busy || code.length !== 6} onClick={() => void verify()}>Verify phone</Button>
    </div>}
  </div>;
}
