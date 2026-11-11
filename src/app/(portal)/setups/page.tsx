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

export default function SetupsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.getSetups>>>([]), [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [photoBusy, setPhotoBusy] = useState(false);
  const [creating, setCreating] = useState(false), [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.getSetups()); } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); api.getListingCategories().then(setCategories).catch(cause => setError((cause as Error).message)); }, [load]);

  return <div className="fade-in">
    <PageHeader title="Setups" description="Show a styled arrangement as inspiration. Customers still rent the items inside it one by one."
      actions={<>
        <Button variant="outline" size="icon" aria-label="Refresh setups" disabled={loading} onClick={() => void load()}><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>
        <Button onClick={() => setCreating(true)}><Plus className="size-4" />New setup</Button>
      </>} />
    {error && <div className="mb-4"><FormError>{error}</FormError></div>}

    <Dialog open={creating} onOpenChange={open => { if (!busy) setCreating(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create a setup showcase</DialogTitle><DialogDescription>Add photos right after creating it.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={async event => {
          event.preventDefault(); if (busy) return;
          const form = event.currentTarget, data = new FormData(form); setBusy(true); setError("");
          try {
            const item = await api.createSetup({ name: String(data.get("name")).trim(), description: String(data.get("description")).trim(),
              categoryId: String(data.get("category")), pricePerDayMinor: etbMinor(String(data.get("rate"))) });
            await load(); form.reset(); setCreating(false); setSelected(item.id); toast.success("Setup created");
          } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
        }}>
          <fieldset disabled={busy} className="grid gap-4">
            <Field label="Name"><input className={controlClass} name="name" required maxLength={255} placeholder="Garden wedding arch" /></Field>
            <Field label="Description"><textarea className={cn(controlClass, "h-auto min-h-20 py-2")} name="description" required maxLength={5000} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category"><select className={controlClass} name="category" required>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
              <Field label="Reference daily rate (ETB)"><input className={controlClass} name="rate" required inputMode="decimal" placeholder="0.00" /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button disabled={!categories.length}>{busy ? "Creating..." : "Create setup"}</Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>

    {!loading && items.length === 0 && <EmptyState icon={<LayoutTemplate className="size-5" />} title="No setups yet"
      description="Show customers a full look, like a decorated stage or a dessert table, built from your rentals."
      action={<Button onClick={() => setCreating(true)}>Create your first setup</Button>} />}
    {items.length > 0 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <li key={item.id} className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:shadow-md">
        <div className="aspect-[4/3] bg-muted">
          {item.imageUrl ? <img alt={item.name} src={photoUrl(item.imageUrl)} className="size-full object-cover" />
            : <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-8" /></div>}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div><p className="font-medium">{item.name}</p><p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div>
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => setSelected(item.id)}><ImagePlus className="size-3.5" />Manage setup photos</Button>
        </div>
      </li>)}
    </ul>}

    {selected && <ListingDialog label="Setup photos" busy={photoBusy} onClose={() => setSelected(null)}>
      <div><h2 className="text-lg font-semibold">Setup photos</h2><p className="text-sm text-muted-foreground">The first photo is the cover.</p></div>
      <ListingPhotoManager itemId={selected} kind="setups" onBusyChange={setPhotoBusy} onChanged={() => void load()} />
      <div className="flex justify-end"><Button variant="outline" disabled={photoBusy} onClick={() => setSelected(null)}>Done</Button></div>
    </ListingDialog>}
  </div>;
}
