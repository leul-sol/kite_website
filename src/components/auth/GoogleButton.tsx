"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

type GoogleId = {
  accounts: { id: {
    initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: string }) => void;
    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
  } };
};
declare global { interface Window { google?: GoogleId } }

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * "Continue with Google" using Google Identity Services. Shown only when this site has a
 * Google client id and the backend accepts Google sign-in; otherwise renders nothing.
 */
export default function GoogleButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const config = await fetch("/api/backend/auth/google/config", { cache: "no-store" }).then(r => r.json()) as { enabled?: boolean };
        if (!config.enabled || cancelled) return;
      } catch { return; }
      if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Google sign-in could not load"));
          document.head.appendChild(script);
        }).catch(() => undefined);
      }
      if (cancelled || !window.google || !box.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: r => callback.current(r.credential) });
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: box.current.offsetWidth || 320 });
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!clientId) return null;
  return <div className={ready ? "space-y-4" : "hidden"}>
    <div ref={box} className="flex w-full justify-center" />
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
  </div>;
}

/** Signs in with Google. Returns the next step for new accounts (they verify a phone first). */
export async function googleSignIn(idToken: string): Promise<{ status: "SIGNED_IN"; role: string } | { status: "PHONE_REQUIRED"; signupToken: string; email: string; name: string }> {
  return await api.auth("google", { idToken, role: "PROVIDER" }) as never;
}
