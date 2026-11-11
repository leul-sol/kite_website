"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";

export type ShellProfile = { businessName: string; verificationStatus: string } | null;

/** Business name, verification status and unread messages for the portal frame. */
export function useProviderShell() {
  const [profile, setProfile] = useState<ShellProfile>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    api.getProviderProfile()
      .then(p => { if (active) setProfile({ businessName: p.businessName, verificationStatus: p.verificationStatus }); })
      .catch(() => undefined);
    const poll = () => api.getUnreadMessages()
      .then(r => { if (active) setUnread(r.count); })
      .catch(() => undefined);
    void poll();
    const timer = setInterval(poll, 30_000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return { profile, unread };
}

export async function signOut() {
  await api.auth("logout");
  window.location.assign("/auth/login");
}
