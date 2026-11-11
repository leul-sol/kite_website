"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/services/api";

export default function StorefrontPage() {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.getProviderProfile>>>();
  const [error, setError] = useState("");
  useEffect(() => { api.getProviderProfile().then(setProfile).catch(e => setError(e.message)); }, []);
  return <div className="fade-in" style={{ maxWidth: 1000 }}>
    <header style={{ marginBottom: 32 }}><h1 className="h1">Storefront Management</h1><p className="text-body">Manage your business profile and verification.</p></header>
    {error && <p role="alert" style={{ color: "var(--error)" }}>{error}</p>}
    {!profile && !error && <p role="status">Loading storefront…</p>}
    {profile && <section className="glass-card" style={{ padding: 32, display: "grid", gap: 20 }}>
      <h2 className="h2">{profile.businessName || "Complete your business profile"}</h2>
      <p>{profile.location}</p><p className="text-body">{profile.bio}</p>
      <p>Verification: <strong>{profile.verificationStatus.replaceAll("_", " ").toLowerCase()}</strong></p>
      <Link className="btn-primary" href="/verification">Edit profile and manage verification</Link>
    </section>}
  </div>;
}
