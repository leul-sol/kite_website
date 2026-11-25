"use client";
import { useCallback, useEffect, useState } from "react";
import { ImageIcon, ImagePlus, LayoutTemplate, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { etbMinor, photoUrl } from "@/services/listing-photos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageHeader } from "@/components/shell/PageHeader";
import { Field, FormError, controlClass } from "@/components/shell/fields";
import { cn } from "@/lib/utils";
import ListingDialog from "@/components/Listings/ListingDialog";
import ListingPhotoManager from "@/components/Listings/ListingPhotoManager";
import { useCategoryName } from "@/i18n/labels";
import { useT } from "@/i18n/I18nProvider";

export default function SetupsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.getSetups>>>([]), [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [photoBusy, setPhotoBusy] = useState(false);
  const [creating, setCreating] = useState(false), [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const { t, err } = useT();
  const categoryName = useCategoryName();
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.getSetups()); } catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); api.getListingCategories().then(setCategories).catch(cause => setError(err(cause, "common.tryAgain"))); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="fade-in">
    <PageHeader title={t("nav.setups")} description={t("set.description")}
      actions={<>
        <Button variant="outline" size="icon" aria-label={t("set.refresh")} disabled={loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>
        <Button onClick={() => setCreating(true)}><Plus className="size-4" />{t("set.new")}</Button>
      </>} />
    {error && <div className="mb-4"><FormError>{error}</FormError></div>}

    <Dialog open={creating} onOpenChange={open => { if (!busy) setCreating(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t("set.createTitle")}</DialogTitle><DialogDescription>{t("set.createText")}</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={async event => {
          event.preventDefault(); if (busy) return;
          const form = event.currentTarget, data = new FormData(form); setBusy(true); setError("");
          try {
            const item = await api.createSetup({ name: String(data.get("name")).trim(), description: String(data.get("description")).trim(),
              categoryId: String(data.get("category")), pricePerDayMinor: etbMinor(String(data.get("rate"))) });
            await load(); form.reset(); setCreating(false); setSelected(item.id); toast.success(t("set.created"));
          } catch (cause) { setError(err(cause, "common.tryAgain")); } finally { setBusy(false); }
        }}>
          <fieldset disabled={busy} className="grid gap-4">
            <Field label={t("common.name")}><input className={controlClass} name="name" required maxLength={255} placeholder={t("set.namePlaceholder")} /></Field>
            <Field label={t("common.description")}><textarea className={cn(controlClass, "h-auto min-h-20 py-2")} name="description" required maxLength={5000} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("common.category")}><select className={controlClass} name="category" required>{categories.map(category => <option key={category.id} value={category.id}>{categoryName(category.id, category.name)}</option>)}</select></Field>
              <Field label={t("set.rate")}><input className={controlClass} name="rate" required inputMode="decimal" placeholder="0.00" /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>{t("common.cancel")}</Button>
              <Button disabled={!categories.length}>{busy ? t("common.creating") : t("set.create")}</Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>

    {!loading && items.length === 0 && <EmptyState icon={<LayoutTemplate className="size-5" />} title={t("set.empty")}
      description={t("set.emptyText")}
      action={<Button onClick={() => setCreating(true)}>{t("set.createFirst")}</Button>} />}
    {items.length > 0 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <li key={item.id} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:shadow-md">
        <div className="aspect-[4/3] bg-muted">
          {item.imageUrl ? <img alt={item.name} src={photoUrl(item.imageUrl)} className="size-full object-cover" />
            : <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-8" /></div>}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div><p className="font-medium">{item.name}</p><p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => setSelected(item.id)}><ImagePlus className="size-3.5" />{t("set.managePhotos")}</Button>
        </div>
      </li>)}
    </ul>}

    {selected && <ListingDialog label={t("set.photos")} busy={photoBusy} onClose={() => setSelected(null)}>
      <div><h2 className="text-lg font-semibold">{t("set.photos")}</h2><p className="text-sm text-muted-foreground">{t("set.coverNote")}</p></div>
      <ListingPhotoManager itemId={selected} kind="setups" onBusyChange={setPhotoBusy} onChanged={() => void load()} />
      <div className="flex justify-end"><Button variant="outline" disabled={photoBusy} onClick={() => setSelected(null)}>{t("common.done")}</Button></div>
    </ListingDialog>}
  </div>;
}
