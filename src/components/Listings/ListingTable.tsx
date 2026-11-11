"use client";
import { useEffect, useState } from "react";
import { api, type Listing } from "../../services/api";
import ListingPhotoManager from "./ListingPhotoManager";
import ListingDialog from "./ListingDialog";
import ListingEditDialog from "./ListingEditDialog";
import styles from "./Listings.module.css";

export default function ListingTable({ refreshSignal }: { refreshSignal?: number }) {
  const [listings, setListings] = useState<Listing[]>([]), [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true; setLoading(true); setError("");
    api.getListings().then(items => { if (mounted) setListings(items); }).catch(() => { if (mounted) setError("Listings could not be loaded."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshSignal, revision]);
  return <>
    {editing && <ListingEditDialog itemId={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setRevision(value => value + 1); }} />}
    {selected && <ListingDialog label={`Photos for ${selected.name}`} busy={photoBusy} onClose={() => setSelected(null)}>
      <h2>{selected.name}</h2>
      <ListingPhotoManager itemId={selected.id} active={selected.status === "Active"} onChanged={() => setRevision(value => value + 1)} onBusyChange={setPhotoBusy} />
      <button className="btn-secondary" disabled={photoBusy} onClick={() => setSelected(null)}>Done</button>
    </ListingDialog>}
    <button className="btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh listings</button>
    {loading && <p role="status">Loading listings...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && listings.length === 0 && <p>No listings yet.</p>}
    {!error && listings.length > 0 && <div className="glass-card" style={{ overflowX: "auto" }}><table className={styles.table}>
      <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Daily rate</th><th>Status</th><th>Manage</th></tr></thead>
      <tbody>{listings.map(item => <tr key={item.id}>
        <td><div className={styles.itemCell}>{item.image && item.status === "Active" && <img className={styles.thumbnail} src={item.image} alt={item.name} />}<span>{item.name}</span></div></td>
        <td>{item.category}</td><td>{item.stock} units</td><td>{item.currency} {(item.priceMinor / 100).toFixed(2)}</td><td>{item.status}</td>
        <td><button className="btn-secondary" onClick={() => setEditing(item.id)}>Edit listing</button><button className="btn-secondary" onClick={() => setSelected(item)}>Manage photos</button></td>
      </tr>)}</tbody>
    </table></div>}
  </>;
}
