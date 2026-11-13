"use client";
import { useEffect, useMemo, useState } from "react";
import { ImageIcon, ImagePlus, Package, Pencil, RefreshCw, Search } from "lucide-react";
import { api, type Listing } from "../../services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shell/PageHeader";
import { cn } from "@/lib/utils";
import ListingPhotoManager from "./ListingPhotoManager";
import ListingDialog from "./ListingDialog";
import ListingEditDialog from "./ListingEditDialog";

const UNIT: Record<Listing["pricingUnit"], string> = { DAY: "day", EVENT: "event", HOUR: "hour", PERSON: "guest" };
type View = "all" | "rentals" | "services" | "active" | "inactive";

function matches(item: Listing, view: View, query: string) {
  const q = query.trim().toLowerCase();
  const inView = view === "all" || (view === "rentals" && item.listingType === "RENTAL") || (view === "services" && item.listingType === "SERVICE")
    || (view === "active" && item.status === "Active") || (view === "inactive" && item.status === "Inactive");
  return inView && (!q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
}

export default function ListingTable({ refreshSignal, onCreate }: { refreshSignal?: number; onCreate?: () => void }) {
  const [listings, setListings] = useState<Listing[]>([]), [selected, setSelected] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<View>("all"), [query, setQuery] = useState("");
  useEffect(() => {
    let mounted = true; setLoading(true); setError("");
    api.getListings().then(items => { if (mounted) setListings(items); }).catch(() => { if (mounted) setError("Listings could not be loaded."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshSignal, revision]);
  const shown = useMemo(() => listings.filter(item => matches(item, view, query)), [listings, view, query]);
  const count = (v: View) => listings.filter(item => matches(item, v, "")).length;

  return <div className="space-y-4">
    {editing && <ListingEditDialog itemId={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setRevision(value => value + 1); }} />}
    {selected && <ListingDialog label={`Photos for ${selected.name}`} busy={photoBusy} onClose={() => setSelected(null)}>
      <div><h2 className="text-lg font-semibold">{selected.name}</h2><p className="text-sm text-muted-foreground">Photos customers see on this listing.</p></div>
      <ListingPhotoManager itemId={selected.id} active={selected.status === "Active"} onChanged={() => setRevision(value => value + 1)} onBusyChange={setPhotoBusy} />
      <div className="flex justify-end"><Button variant="outline" disabled={photoBusy} onClick={() => setSelected(null)}>Done</Button></div>
    </ListingDialog>}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={view} onValueChange={value => setView(value as View)} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          {([["all", "All"], ["rentals", "Rentals"], ["services", "Services"], ["active", "Active"], ["inactive", "Inactive"]] as [View, string][]).map(([v, label]) =>
            <TabsTrigger key={v} value={v}>{label}<span className="ml-1 text-xs text-muted-foreground tabular-nums">{loading ? "" : count(v)}</span></TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search listings" placeholder="Search listings" value={query} onChange={e => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" size="icon" aria-label="Refresh listings" disabled={loading} onClick={() => setRevision(value => value + 1)}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>
    </div>

    {loading && <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Loading listings...</span>
      {[0, 1, 2].map(i => <div key={i} className="overflow-hidden rounded-xl border bg-card"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-2 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/3" /></div></div>)}
    </div>}
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    {!loading && !error && listings.length === 0 && <EmptyState icon={<Package className="size-5" />} title="No listings yet"
      description="Add the rentals and services customers can book. You can add photos right after creating a listing."
      action={onCreate && <Button onClick={onCreate}>Add your first listing</Button>} />}
    {!loading && !error && listings.length > 0 && shown.length === 0 &&
      <EmptyState icon={<Search className="size-5" />} title="No matching listings" description="Try another filter or search word."
        action={<Button variant="outline" onClick={() => { setView("all"); setQuery(""); }}>Clear filters</Button>} />}

    {!loading && !error && shown.length > 0 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map(item => <li key={item.id} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted">
          {item.image && item.status === "Active"
            ? <img className="size-full object-cover" src={item.image} alt={item.name} />
            : <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-8" /></div>}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge className={cn("shadow-sm", item.listingType === "SERVICE" ? "bg-primary text-primary-foreground" : "bg-card text-foreground")}>{item.listingType === "SERVICE" ? "Service" : "Rental"}</Badge>
            {item.status === "Inactive" && <Badge variant="secondary" className="shadow-sm">Inactive</Badge>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground"><span className="capitalize">{item.category}</span> · {item.listingType === "SERVICE" ? `${item.stock} ${item.stock === 1 ? "booking" : "bookings"} per day` : `${item.stock} in stock`}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums">{item.currency} {(item.priceMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {UNIT[item.pricingUnit]}</span></p>
          <div className="mt-auto flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(item.id)}><Pencil className="size-3.5" />Edit listing</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(item)}><ImagePlus className="size-3.5" />Manage photos</Button>
          </div>
        </div>
      </li>)}
    </ul>}
  </div>;
}
