"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { listingEditPayload, type ListingDetail, type ListingEdit } from "../../services/listing-edit";
import ListingDialog from "./ListingDialog";
import ListingEditView from "./ListingEditView";
import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/shell/fields";
import { useT } from "@/i18n/I18nProvider";

export default function ListingEditDialog({ itemId, onClose, onSaved }: { itemId: string; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState<{ item: ListingDetail; categories: { id: string; name: string }[] } | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [conflict, setConflict] = useState(false), [pending, setPending] = useState<ListingEdit | null>(null);
  const [archive, setArchive] = useState(false);
  const locked = useRef(false), mounted = useRef(true), controller = useRef<AbortController | null>(null);
  const { t, err } = useT();
  const load = useCallback(async () => {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    setLoading(true); setData(null); setError(""); setPending(null); setArchive(false);
    try {
      const [item, categories] = await Promise.all([api.getListing(itemId, abort.signal), api.getListingCategories(abort.signal)]);
      if (!abort.signal.aborted) { setData({ item, categories }); setConflict(false); }
    } catch (cause) { if (!abort.signal.aborted) setError(err(cause, "lst.loadOne")); }
    finally { if (!abort.signal.aborted) setLoading(false); }
  }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; controller.current?.abort(); }; }, [load]);
  const save = async (payload: ListingEdit) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await api.editListing(itemId, payload); if (mounted.current) onSaved(); }
    catch (cause) {
      if (mounted.current) {
        setError(err(cause, "lst.saveUnconfirmed"));
        // A server/network error may have followed a committed write. Require a fresh revision before retrying.
        setConflict(true); setPending(null);
      }
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  };
  return <ListingDialog label={t("lst.edit")} busy={busy} onClose={onClose}>
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold">{t("lst.edit")}</h2><p className="text-sm text-muted-foreground">{t("lst.editText")}</p></div>
      <Button variant="ghost" size="sm" disabled={loading || busy} onClick={() => void load()}><RefreshCw className="size-3.5" />{t("lst.reload")}</Button>
    </div>
    {loading && <div role="status" className="space-y-3"><span className="sr-only">{t("lst.loadingOne")}</span>{[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>}
    {error && <FormError>{error}</FormError>}
    {conflict && <p className="rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm">{t("lst.conflict")}</p>}
    {data && <ListingEditView key={data.item.revision} item={data.item} categories={data.categories} busy={busy || archive} conflict={conflict} pending={pending}
      onSubmit={event => {
        event.preventDefault(); if (locked.current || conflict) return;
        try {
          const payload = listingEditPayload(data.item, new FormData(event.currentTarget)); setError("");
          if (payload.active !== data.item.active || payload.quantityAvailable < data.item.quantityAvailable) setPending(payload); else void save(payload);
        } catch (cause) { setError(err(cause, "common.tryAgain")); }
      }} onConfirm={() => { if (pending) void save(pending); }} onBack={() => setPending(null)} />}
    {data && <div className="rounded-xl border border-destructive/30 p-4">
      {!archive ? <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-medium">{t("lst.remove")}</p><p className="text-xs text-muted-foreground">{t("lst.removeHint")}</p></div>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy || conflict || !!pending} onClick={() => setArchive(true)}>
          <Trash2 className="size-4" />{t("lst.remove")}</Button>
      </div> : <section role="group" aria-label={t("lst.confirmRemovalLabel")} className="space-y-3">
        <h3 className="font-medium">{t("lst.removeTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("lst.removeText")}</p>
        <div className="flex gap-2">
          <Button variant="destructive" disabled={busy} onClick={async () => {
            if(locked.current)return;locked.current=true;setBusy(true);setError("");
            try{await api.archiveListing(itemId,data.item.revision);if(mounted.current)onSaved();}
            catch(cause){if(mounted.current){setError((cause as Error).message);setConflict(true);setArchive(false);}}
            finally{locked.current=false;if(mounted.current)setBusy(false);}
          }}>{t("lst.confirmRemoval")}</Button>
          <Button variant="outline" disabled={busy} onClick={()=>setArchive(false)}>{t("lst.keep")}</Button>
        </div>
      </section>}
    </div>}
    <div className="flex justify-end"><Button variant="ghost" disabled={busy} onClick={onClose}>{t("lst.closeEditor")}</Button></div>
  </ListingDialog>;
}
