"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { validatePhoto, type ListingPhoto } from "../../services/listing-photos";
import ListingPhotoView from "./ListingPhotoView";

export default function ListingPhotoManager({ itemId, active = true, kind = "items", onChanged, onBusyChange }: { itemId: string; active?: boolean; kind?: "items" | "setups"; onChanged?: () => void; onBusyChange?: (busy: boolean) => void }) {
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setReady(false);
    try { const data = await api.getListingPhotos(itemId, signal, kind); if (!signal?.aborted && mounted.current) { setPhotos(data); setReady(true); } }
    catch { if (!signal?.aborted && mounted.current) setError("Photos could not be loaded. Refresh to try again."); }
    finally { if (!signal?.aborted && mounted.current) setLoading(false); }
  }, [itemId, kind]);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController(); void load(controller.signal);
    return () => { mounted.current = false; controller.abort(); };
  }, [load]);
  const run = async (operation: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); onBusyChange?.(true); setError("");
    try { await operation(); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Photo change failed."); }
    finally {
      if (mounted.current) { setPendingDelete(null); await load(); onChanged?.(); setBusy(false); onBusyChange?.(false); }
      lock.current = false;
    }
  };
  return <ListingPhotoView photos={photos} loading={loading} busy={busy} ready={ready} error={error} active={active}
    pendingDelete={pendingDelete} onDelete={setPendingDelete} onCancelDelete={() => setPendingDelete(null)}
    onConfirmDelete={() => { if (pendingDelete) void run(() => api.deleteListingPhoto(itemId, pendingDelete, kind)); }}
    onRefresh={() => { setError(""); void load(); }}
    onUpload={file => { try { validatePhoto(file); void run(() => api.uploadListingPhoto(itemId, file, kind)); } catch (cause) { setError((cause as Error).message); } }}
    onCover={id => { const ids = [id, ...photos.filter(photo => photo.id !== id).map(photo => photo.id)]; void run(() => api.orderListingPhotos(itemId, ids, kind)); }} />;
}
