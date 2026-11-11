"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { listingEditPayload, type ListingDetail, type ListingEdit } from "../../services/listing-edit";
import ListingDialog from "./ListingDialog";
import ListingEditView from "./ListingEditView";

export default function ListingEditDialog({ itemId, onClose, onSaved }: { itemId: string; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState<{ item: ListingDetail; categories: { id: string; name: string }[] } | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [conflict, setConflict] = useState(false), [pending, setPending] = useState<ListingEdit | null>(null);
  const [archive, setArchive] = useState(false);
  const locked = useRef(false), mounted = useRef(true), controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    setLoading(true); setData(null); setError(""); setPending(null); setArchive(false);
    try {
      const [item, categories] = await Promise.all([api.getListing(itemId, abort.signal), api.getListingCategories(abort.signal)]);
      if (!abort.signal.aborted) { setData({ item, categories }); setConflict(false); }
    } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Listing could not be loaded."); }
    finally { if (!abort.signal.aborted) setLoading(false); }
  }, [itemId]);
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; controller.current?.abort(); }; }, [load]);
  const save = async (payload: ListingEdit) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await api.editListing(itemId, payload); if (mounted.current) onSaved(); }
    catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Save could not be confirmed. Reload the listing before trying again.");
        // A server/network error may have followed a committed write. Require a fresh revision before retrying.
        setConflict(true); setPending(null);
      }
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  };
  return <ListingDialog label="Edit listing" busy={busy} onClose={onClose}>
    <h2>Edit listing</h2>
    {loading && <p role="status">Loading listing...</p>}
    {error && <p role="alert">{error}</p>}
    {conflict && <p>Reload to use the latest listing before saving again. Reloading replaces the unsaved form.</p>}
    <button className="btn-secondary" disabled={loading || busy} onClick={() => void load()}>Reload listing</button>
    {data && <ListingEditView key={data.item.revision} item={data.item} categories={data.categories} busy={busy || archive} conflict={conflict} pending={pending}
      onSubmit={event => {
        event.preventDefault(); if (locked.current || conflict) return;
        try {
          const payload = listingEditPayload(data.item, new FormData(event.currentTarget)); setError("");
          if (payload.active !== data.item.active || payload.quantityAvailable < data.item.quantityAvailable) setPending(payload); else void save(payload);
        } catch (cause) { setError((cause as Error).message); }
      }} onConfirm={() => { if (pending) void save(pending); }} onBack={() => setPending(null)} />}
    {data && !archive && <button className="btn-secondary" disabled={busy || conflict || !!pending} onClick={() => setArchive(true)}>Remove listing</button>}
    {data && archive && <section role="group" aria-label="Confirm listing removal"><h3>Remove listing from inventory?</h3><p>This hides the listing and its photos. Existing bookings and history are retained. Removal cannot be undone in this portal.</p>
      <button className="btn-primary" disabled={busy} onClick={async () => {
        if(locked.current)return;locked.current=true;setBusy(true);setError("");
        try{await api.archiveListing(itemId,data.item.revision);if(mounted.current)onSaved();}
        catch(cause){if(mounted.current){setError((cause as Error).message);setConflict(true);setArchive(false);}}
        finally{locked.current=false;if(mounted.current)setBusy(false);}
      }}>Confirm removal</button><button className="btn-secondary" disabled={busy} onClick={()=>setArchive(false)}>Keep listing</button></section>}
    <button className="btn-secondary" disabled={busy} onClick={onClose}>Close editor</button>
  </ListingDialog>;
}
