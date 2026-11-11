"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, backendFetch, KycDocument, KycSubmission, KycSummary } from "@/services/api";
import styles from "./verification.module.css";

const types = ["IDENTITY", "BUSINESS_REGISTRATION", "TAX_CERTIFICATE", "ADDRESS_PROOF", "OTHER"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
export default function VerificationPage() {
  const [summary, setSummary] = useState<KycSummary>();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [profile, setProfile] = useState({ businessName: "", location: "", bio: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const attempt = useRef<{ selection: string; key: string } | null>(null);
  const load = useCallback(async (refreshProfile = false) => {
    const [state, docs, cases, business] = await Promise.all([api.getKycSummary(), api.getKycDocuments(), api.getKycSubmissions(), api.getProviderProfile()]);
    setSummary(state); setDocuments(docs); setSubmissions(cases);
    if (refreshProfile) setProfile({ businessName: business.businessName ?? "", location: business.location ?? "", bio: business.bio ?? "" });
    setSelected(ids => ids.filter(id => docs.some(d => d.id === id)));
  }, []);
  useEffect(() => { load(true).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [load]);
  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); await load(); setMessage(success); }
    catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const pending = summary?.submissionStatus === "SUBMITTED";
  const missingTypes = summary?.requiredDocumentTypes.filter(type => !documents.some(d => selected.includes(d.id) && d.type === type)) ?? [];
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file") as File;
    if (!file?.size || file.size > (summary?.maxFileBytes ?? 0) || !["image/png", "image/jpeg", "application/pdf"].includes(file.type)) {
      setError("Choose a PNG, JPEG or PDF within the displayed size limit."); return;
    }
    void run(async () => { const doc = await api.uploadKycDocument(String(data.get("type")), file); setSelected(ids => ids.includes(doc.id) ? ids : [...ids, doc.id]); form.reset(); }, "Document uploaded. Select the evidence to submit.");
  }
  async function download(doc: KycDocument) {
    await run(async () => {
      const response = await backendFetch(`/api/v1/providers/me/kyc/documents/${doc.id}/content`);
      if (!response.ok) throw new Error("Unable to download this document.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${doc.id}.${doc.contentType === "application/pdf" ? "pdf" : doc.contentType === "image/png" ? "png" : "jpg"}`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "Document downloaded.");
  }
  if (loading) return <p role="status">Loading verification…</p>;
  if (!summary) return <div><p role="alert">{error || "Unable to load verification."}</p><button className="btn-secondary" onClick={() => { setLoading(true); setError(""); load(true).catch(e => setError(e.message)).finally(() => setLoading(false)); }}>Try again</button></div>;
  return <div className={styles.page}>
    <header><h1 className="h1">Business verification</h1><p className="text-body">Complete your business profile and submit private evidence for review.</p><p>Status: <strong>{label(summary.verificationStatus)}</strong></p></header>
    <div aria-live="polite">{error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status">{message}</p>}</div>
    <fieldset disabled={busy} className={styles.fields}>
      <section className={`glass-card ${styles.card}`}>
        <h2 className="h2">Business profile</h2>
        <p className="text-small">Save profile edits before submitting documents. Changing the business name or location after approval requires a new review. These fields are locked while a submission is pending.</p>
        <form onSubmit={e => { e.preventDefault(); void run(() => api.updateProviderProfile(profile), "Business profile saved."); }} className={styles.form}>
          <label>Business name<input required maxLength={255} disabled={pending} value={profile.businessName} onChange={e => setProfile({ ...profile, businessName: e.target.value })} /></label>
          <label>Location<input required maxLength={255} disabled={pending} value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} /></label>
          <label>About your business<textarea aria-label="About your business" required maxLength={5000} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></label>
          <button className="btn-primary">Save business profile</button>
        </form>
      </section>
      <section className={`glass-card ${styles.card}`}>
        <h2 className="h2">Private documents</h2>
        <p>Required: {summary.requiredDocumentTypes.map(label).join(", ")}. PNG, JPEG, or an unencrypted PDF (1-5 pages), up to {Math.floor(summary.maxFileBytes / 1024 / 1024)} MiB each.</p>
        <p className="text-small">Evidence is private. Documents included in a submission are retained as review records and cannot be deleted here.</p>
        {!summary.uploadsAvailable ? <p role="status">Document uploads are temporarily unavailable. Please contact support.</p> : <form onSubmit={upload} className={styles.form}>
          <label>Document type<select aria-label="Document type" name="type">{types.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></label>
          <label>Evidence document<input required name="file" type="file" accept="image/png,image/jpeg,application/pdf" /></label>
          <p>PDFs: one to five unencrypted pages. Files are flattened to remove interactive content.</p>
          <button className="btn-secondary" disabled={documents.length >= summary.maxStoredDocuments}>Upload document</button>
        </form>}
        {!documents.length && <p>No documents uploaded yet.</p>}
        <ul className={styles.list}>{documents.map(doc => <li key={doc.id}>
          <label className={styles.check}><input type="checkbox" disabled={pending} checked={selected.includes(doc.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, doc.id] : ids.filter(id => id !== doc.id))} /><span>{label(doc.type)} · {Math.ceil(doc.sizeBytes / 1024)} KiB · {new Date(doc.createdAt).toLocaleDateString()}<small>{doc.id.slice(0, 8)}{doc.submitted ? " · retained review evidence" : " · draft"}</small></span></label>
          <div className={styles.actions}><button className="btn-secondary" onClick={() => void download(doc)}>Download</button>{!doc.submitted && <button className="btn-secondary" onClick={() => void run(() => api.deleteKycDocument(doc.id), "Draft document deleted.")}>Delete draft</button>}</div>
        </li>)}</ul>
        {!pending && <>
          <p>Select up to {summary.maxDocumentsPerSubmission} documents. {missingTypes.length ? `Still required: ${missingTypes.map(label).join(", ")}.` : "Required evidence selected."}</p>
          <button className="btn-primary" disabled={!selected.length || !!missingTypes.length || selected.length > summary.maxDocumentsPerSubmission} onClick={() => {
            const selection = [...selected].sort().join(",");
            if (attempt.current?.selection !== selection) attempt.current = { selection, key: crypto.randomUUID() };
            void run(async () => { await api.submitKyc(selected, attempt.current!.key); attempt.current = null; setSelected([]); }, "Submitted for review.");
          }}>Submit selected documents</button>
        </>}
        {pending && <form className={styles.form} onSubmit={e => { e.preventDefault(); void run(() => api.withdrawKyc(summary.currentSubmissionId!, reason), "Submission withdrawn."); }}>
          <p>Your submission is awaiting review.</p><label>Reason for withdrawal<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label><button className="btn-secondary">Withdraw submission</button>
        </form>}
      </section>
      <section className={`glass-card ${styles.card}`}><h2 className="h2">Submission history</h2><button className="btn-secondary" onClick={() => void run(async () => {}, "Verification refreshed.")}>Refresh status</button>
        {!submissions.length && <p>No submissions yet.</p>}
        <ul className={styles.list}>{submissions.map(item => <li key={item.id}><strong>{label(item.status)}</strong><p>{item.businessName} · {item.location} · {new Date(item.createdAt).toLocaleString()}</p><p>{item.documents.length} document(s) · {item.id.slice(0, 8)}</p>{item.reviewReason && <p>Review: {item.reviewReason}</p>}</li>)}</ul>
      </section>
    </fieldset>
    {busy && <p role="status">Please wait…</p>}
  </div>;
}
