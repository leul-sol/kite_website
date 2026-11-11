import type { ListingPhoto } from "../../services/listing-photos";
import styles from "./Listings.module.css";

export default function ListingPhotoView(props: {
  photos: ListingPhoto[]; loading: boolean; busy: boolean; ready: boolean; error: string; active: boolean;
  pendingDelete: string | null; onDelete: (id: string) => void; onCancelDelete: () => void; onConfirmDelete: () => void;
  onRefresh: () => void; onUpload: (file: File) => void; onCover: (id: string) => void;
}) {
  const disabled = props.loading || props.busy || !props.ready;
  return <section aria-label="Listing photos" aria-busy={props.loading || props.busy}>
    <h3>Listing photos</h3>
    <p>Upload up to five PNG or JPEG photos, 2 MiB each. The first uploaded photo is the cover. Photos on active listings are public.</p>
    {!props.active && <p>Photos for this inactive listing are hidden from public view.</p>}
    {props.error && <p role="alert">{props.error}</p>}
    {props.loading && <p role="status">Loading photos...</p>}
    {props.busy && <p role="status">Saving photo changes...</p>}
    <button className="btn-secondary" type="button" disabled={props.busy || props.loading} onClick={props.onRefresh}>Refresh photos</button>
    <label className={styles.field}>Add photo
      <input type="file" accept="image/png,image/jpeg" disabled={disabled || props.photos.length >= 5 || !!props.pendingDelete}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) props.onUpload(file); }} />
    </label>
    {!props.loading && props.ready && props.photos.length === 0 && <p>No uploaded photos yet.</p>}
    {props.pendingDelete && <div role="group" aria-label="Confirm photo removal">
      <p>Remove this photo from the listing?</p>
      <button className="btn-primary" disabled={disabled} onClick={props.onConfirmDelete}>Remove photo</button>
      <button className="btn-secondary" disabled={disabled} onClick={props.onCancelDelete}>Keep photo</button>
    </div>}
    {!props.loading && props.ready && <div className={styles.photoGrid}>{props.photos.map((photo, index) => <article key={photo.id}>
      {props.active && <img src={photo.url} alt={`Listing photo ${index + 1}`} className={styles.photo} />}
      <p>{index === 0 ? "Cover photo" : `Photo ${index + 1}`} ({photo.width} x {photo.height})</p>
      <button className="btn-secondary" disabled={disabled || index === 0 || !!props.pendingDelete} onClick={() => props.onCover(photo.id)}>Make cover</button>
      <button className="btn-secondary" disabled={disabled || !!props.pendingDelete} onClick={() => props.onDelete(photo.id)}>Delete photo {index + 1}</button>
    </article>)}</div>}
  </section>;
}
