"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, FileText, History, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, backendFetch, KycDocument, KycSubmission, KycSummary } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const types = ["IDENTITY", "BUSINESS_REGISTRATION", "TAX_CERTIFICATE", "ADDRESS_PROOF", "OTHER"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
const TONE: Record<string, string> = { VERIFIED: "bg-success/10 text-success", APPROVED: "bg-success/10 text-success",
  SUBMITTED: "bg-warning/10 text-warning", PENDING: "bg-warning/10 text-warning", REJECTED: "bg-destructive/10 text-destructive" };

export default function VerificationPage() {
  const [summary, setSummary] = useState<KycSummary>();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [profile, setProfile] = useState({ businessName: "", location: "", bio: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    setBusy(true); setError("");
    try { await work(); await load(); toast.success(success); }
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

  if (loading) return <div role="status" className="space-y-4"><span className="sr-only">Loading verification…</span><Skeleton className="h-16 w-80" /><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (!summary) return <div className="space-y-3"><FormError>{error || "Unable to load verification."}</FormError>
    <Button variant="outline" onClick={() => { setLoading(true); setError(""); load(true).catch(e => setError(e.message)).finally(() => setLoading(false)); }}>Try again</Button></div>;

  const verified = summary.verificationStatus === "VERIFIED";
  const profileDone = !!(profile.businessName && profile.location && profile.bio);
  const steps = [
    { title: "Business profile", done: profileDone },
    { title: "Upload documents", done: summary.requiredDocumentTypes.every(type => documents.some(d => d.type === type)) },
    { title: "Submit for review", done: pending || verified },
    { title: "Verified", done: verified },
  ];

  return <div className="fade-in space-y-6">
    <PageHeader title="Business verification" description="Verified businesses get a badge customers trust. Your documents stay private."
      actions={<Badge variant="outline" className={cn("border-transparent px-3 py-1 text-sm capitalize", TONE[summary.verificationStatus] ?? "bg-muted text-muted-foreground")}>Status: {label(summary.verificationStatus)}</Badge>} />

    <ol className="grid gap-2 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-4">
      {steps.map((step, index) => <li key={step.title} className="flex items-center gap-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold", step.done ? "border-primary bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          {step.done ? <Check className="size-4" /> : index + 1}
        </span>
        <span className={cn("text-sm", step.done ? "font-medium" : "text-muted-foreground")}>{step.title}</span>
      </li>)}
    </ol>

    <div aria-live="polite">{error && <FormError>{error}</FormError>}{busy && <p role="status" className="sr-only">Please wait…</p>}</div>

    <fieldset disabled={busy} className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
        <div><h2 className="font-semibold">Business profile</h2>
          <p className="text-sm text-muted-foreground">Save edits before submitting. Changing name or location after approval needs a new review. Locked while a submission is pending.</p></div>
        <form onSubmit={e => { e.preventDefault(); void run(() => api.updateProviderProfile(profile), "Business profile saved."); }} className="grid gap-4">
          <Field label="Business name"><input className={controlClass} required maxLength={255} disabled={pending} value={profile.businessName} onChange={e => setProfile({ ...profile, businessName: e.target.value })} /></Field>
          <Field label="Location"><input className={controlClass} required maxLength={255} disabled={pending} value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} /></Field>
          <Field label="About your business"><textarea className={cn(controlClass, "h-auto min-h-28 py-2")} aria-label="About your business" required maxLength={5000} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></Field>
          <div className="flex justify-end"><Button>Save business profile</Button></div>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
        <div><h2 className="font-semibold">Private documents</h2>
          <p className="text-sm text-muted-foreground">Required: <span className="capitalize">{summary.requiredDocumentTypes.map(label).join(", ")}</span>. PNG, JPEG or an unencrypted PDF (1–5 pages), up to {Math.floor(summary.maxFileBytes / 1024 / 1024)} MiB each.</p></div>
        {!summary.uploadsAvailable ? <p role="status" className="rounded-lg bg-warning/10 p-3 text-sm text-warning">Document uploads are temporarily unavailable. Please contact support.</p> :
          <form onSubmit={upload} className="grid gap-3 rounded-lg border border-dashed p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Document type"><select className={cn(controlClass, "capitalize")} aria-label="Document type" name="type">{types.map(type => <option key={type} value={type}>{label(type)}</option>)}</select></Field>
              <Field label="Evidence document"><input className={cn(controlClass, "py-1 file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium")} required name="file" type="file" accept="image/png,image/jpeg,application/pdf" /></Field>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">PDFs are flattened to remove interactive content.</p>
              <Button variant="secondary" disabled={documents.length >= summary.maxStoredDocuments}><Upload className="size-4" />Upload document</Button>
            </div>
          </form>}

        {!documents.length && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
        <ul className="space-y-2">{documents.map(doc => <li key={doc.id} className={cn("flex items-center gap-3 rounded-lg border p-3 transition", selected.includes(doc.id) && "border-primary/50 bg-primary/5")}>
          <input type="checkbox" aria-label={`Select ${label(doc.type)} document ${doc.id.slice(0, 8)}`} className="size-4 accent-[var(--primary)]" disabled={pending} checked={selected.includes(doc.id)}
            onChange={e => setSelected(ids => e.target.checked ? [...ids, doc.id] : ids.filter(id => id !== doc.id))} />
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">{label(doc.type)}</p>
            <p className="text-xs text-muted-foreground">{Math.ceil(doc.sizeBytes / 1024)} KiB · {new Date(doc.createdAt).toLocaleDateString()} · {doc.submitted ? "retained review evidence" : "draft"}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Download" onClick={() => void download(doc)}><Download className="size-4" /></Button>
          {!doc.submitted && <Button variant="ghost" size="icon" aria-label="Delete draft" onClick={() => void run(() => api.deleteKycDocument(doc.id), "Draft document deleted.")}><Trash2 className="size-4" /></Button>}
        </li>)}</ul>

        {!pending && <div className="space-y-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">Select up to {summary.maxDocumentsPerSubmission} documents. {missingTypes.length ? <>Still required: <span className="capitalize">{missingTypes.map(label).join(", ")}</span>.</> : "Required evidence selected."}</p>
          <Button className="w-full" disabled={!selected.length || !!missingTypes.length || selected.length > summary.maxDocumentsPerSubmission} onClick={() => {
            const selection = [...selected].sort().join(",");
            if (attempt.current?.selection !== selection) attempt.current = { selection, key: crypto.randomUUID() };
            void run(async () => { await api.submitKyc(selected, attempt.current!.key); attempt.current = null; setSelected([]); }, "Submitted for review.");
          }}>Submit selected documents</Button>
        </div>}
        {pending && <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); void run(() => api.withdrawKyc(summary.currentSubmissionId!, reason), "Submission withdrawn."); }}>
          <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">Your submission is awaiting review.</p>
          <Field label="Reason for withdrawal"><textarea className={cn(controlClass, "h-auto min-h-20 py-2")} required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></Field>
          <div className="flex justify-end"><Button variant="outline">Withdraw submission</Button></div>
        </form>}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-5 shadow-xs lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold"><History className="size-4" />Submission history</h2>
          <Button variant="outline" size="sm" onClick={() => void run(async () => {}, "Verification refreshed.")}><RefreshCw className="size-3.5" />Refresh status</Button>
        </div>
        {!submissions.length && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
        <ul className="divide-y">{submissions.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
          <div className="space-y-0.5 text-sm">
            <p className="font-medium">{item.businessName} · {item.location}</p>
            <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()} · {item.documents.length} document(s) · {item.id.slice(0, 8)}</p>
            {item.reviewReason && <p className="text-muted-foreground">Review: {item.reviewReason}</p>}
          </div>
          <Badge variant="outline" className={cn("border-transparent capitalize", TONE[item.status] ?? "bg-muted text-muted-foreground")}>{label(item.status)}</Badge>
        </li>)}</ul>
      </section>
    </fieldset>
  </div>;
}
