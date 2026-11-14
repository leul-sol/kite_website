import { ImagePlus, RefreshCw, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ListingPhoto } from "../../services/listing-photos";
import { FormError } from "@/components/shell/fields";
import { useT } from "@/i18n/I18nProvider";

export default function ListingPhotoView(props: {
  photos: ListingPhoto[]; loading: boolean; busy: boolean; ready: boolean; error: string; active: boolean;
  pendingDelete: string | null; onDelete: (id: string) => void; onCancelDelete: () => void; onConfirmDelete: () => void;
  onRefresh: () => void; onUpload: (file: File) => void; onCover: (id: string) => void;
}) {
  const { t } = useT();
  const disabled = props.loading || props.busy || !props.ready;
  const full = props.photos.length >= 5;
  return <section aria-label={t("photo.section")} aria-busy={props.loading || props.busy} className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-medium">{t("photo.section")}</h3>
        <p className="text-xs text-muted-foreground">{t("photo.help")}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" disabled={props.busy || props.loading} onClick={props.onRefresh}><RefreshCw className="size-3.5" />{t("photo.refresh")}</Button>
    </div>
    {!props.active && <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{t("photo.inactive")}</p>}
    {props.error && <FormError>{props.error}</FormError>}
    {props.loading && <p role="status" className="text-sm text-muted-foreground">{t("photo.loading")}</p>}
    {props.busy && <p role="status" className="text-sm text-muted-foreground">{t("photo.saving")}</p>}

    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm transition hover:border-primary/50 hover:bg-accent/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50`}>
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><ImagePlus className="size-4" /></span>
      <span><span className="block font-medium">{t("photo.add")}</span><span className="block text-xs text-muted-foreground">{full ? t("photo.full") : t("photo.types")}</span></span>
      <input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={disabled || full || !!props.pendingDelete}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) props.onUpload(file); }} />
    </label>

    {!props.loading && props.ready && props.photos.length === 0 && <p className="text-sm text-muted-foreground">{t("photo.none")}</p>}
    {props.pendingDelete && <div role="group" aria-label={t("photo.confirmLabel")} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm">{t("photo.removeQ")}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={disabled} onClick={props.onConfirmDelete}>{t("photo.remove")}</Button>
        <Button size="sm" variant="outline" disabled={disabled} onClick={props.onCancelDelete}>{t("photo.keep")}</Button>
      </div>
    </div>}
    {!props.loading && props.ready && props.photos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{props.photos.map((photo, index) => <article key={photo.id} className="overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {props.active && <img src={photo.url} alt={t("photo.alt", { n: index + 1 })} className="size-full object-cover" />}
        {index === 0 && <Badge className="absolute left-2 top-2 shadow-sm"><Star className="size-3" />{t("photo.cover")}</Badge>}
      </div>
      <div className="space-y-2 p-2">
        <p className="text-xs text-muted-foreground">{index === 0 ? t("photo.coverPhoto") : t("photo.n", { n: index + 1 })} ({photo.width} x {photo.height})</p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 flex-1 px-2 text-xs" disabled={disabled || index === 0 || !!props.pendingDelete} onClick={() => props.onCover(photo.id)}>{t("photo.makeCover")}</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={disabled || !!props.pendingDelete} onClick={() => props.onDelete(photo.id)}><Trash2 className="size-3" /><span className="sr-only">{t("photo.delete", { n: index + 1 })}</span></Button>
        </div>
      </div>
    </article>)}</div>}
  </section>;
}
