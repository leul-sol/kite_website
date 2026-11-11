"use client";
import styles from "../operations.module.css";
import {useCallback,useEffect,useState} from "react";
import {api} from "../../../services/api";
import {etbMinor,photoUrl} from "../../../services/listing-photos";
import ListingDialog from "../../../components/Listings/ListingDialog";
import ListingPhotoManager from "../../../components/Listings/ListingPhotoManager";
export default function SetupsPage(){
  const [items,setItems]=useState<Awaited<ReturnType<typeof api.getSetups>>>([]),[selected,setSelected]=useState<string|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[photoBusy,setPhotoBusy]=useState(false);
  const [categories,setCategories]=useState<Array<{id:string;name:string}>>([]);
  const load=useCallback(async()=>{try{setItems(await api.getSetups());}catch(cause){setError((cause as Error).message);}},[]);
  useEffect(()=>{void load();api.getListingCategories().then(setCategories).catch(cause=>setError((cause as Error).message));},[load]);
  return <div className={styles.page}><h1 className="h1">Setup showcases</h1><p>Show a curated arrangement. Customers rent the underlying inventory items separately.</p>{error&&<p role="alert">{error}</p>}
    <form onSubmit={async event=>{event.preventDefault();if(busy)return;const form=event.currentTarget,data=new FormData(form);setBusy(true);setError("");try{const item=await api.createSetup({name:String(data.get("name")).trim(),description:String(data.get("description")).trim(),categoryId:String(data.get("category")),pricePerDayMinor:etbMinor(String(data.get("rate")))});await load();setSelected(item.id);form.reset();}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}}>
      <fieldset disabled={busy}><legend>Create a setup showcase</legend><label>Name<input name="name" required maxLength={255}/></label><label>Description<input name="description" required maxLength={5000}/></label><label>Category<select name="category" required>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Reference daily rate (ETB)<input name="rate" required inputMode="decimal"/></label><button className="btn-primary" disabled={!categories.length}>Create setup</button></fieldset>
    </form>
    <button className="btn-secondary" onClick={()=>void load()}>Refresh setups</button>
    {items.map(item=><article key={item.id} className="glass-card" style={{padding:20,marginTop:16}}><h2>{item.name}</h2><p>{item.description}</p>{item.imageUrl&&<img alt={item.name} src={photoUrl(item.imageUrl)} width={180}/>}<button className="btn-secondary" onClick={()=>setSelected(item.id)}>Manage setup photos</button></article>)}
    {selected&&<ListingDialog label="Setup photos" busy={photoBusy} onClose={()=>setSelected(null)}><ListingPhotoManager itemId={selected} kind="setups" onBusyChange={setPhotoBusy} onChanged={()=>void load()}/><button disabled={photoBusy} className="btn-secondary" onClick={()=>setSelected(null)}>Done</button></ListingDialog>}
  </div>;
}
