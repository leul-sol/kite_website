"use client";
import styles from "../operations.module.css";
import {useEffect,useState} from "react";
import {api,type Dispute} from "../../../services/api";
import type {Order} from "../../../services/orders";
export default function DisputesPage(){
 const [orders,setOrders]=useState<Order[]>([]),[booking,setBooking]=useState(""),[items,setItems]=useState<Dispute[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;api.getOrders().then(data=>{if(active)setOrders(data);}).catch(cause=>{if(active)setError((cause as Error).message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 useEffect(()=>{let active=true;setItems([]);if(booking){setLoading(true);setError("");api.getDisputes(booking).then(data=>{if(active)setItems(data);}).catch(cause=>{if(active)setError((cause as Error).message);}).finally(()=>{if(active)setLoading(false);});}return()=>{active=false;};},[booking]);
 const selected=orders.find(order=>order.id===booking),canOpen=selected&&!['COMPLETED','CANCELLED','REJECTED','REFUNDED','EXPIRED'].includes(selected.status)&&!items.some(item=>item.status==='OPEN');
 return <div className={styles.page}><h1 className="h1">Booking disputes</h1><p>An open dispute blocks rental completion while the issue is reviewed.</p>{error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading disputes...</p>}
 <label>Booking<select aria-label="Booking" value={booking} disabled={busy} onChange={event=>setBooking(event.target.value)}><option value="">Select a booking</option>{orders.map(order=><option key={order.id} value={order.id}>{order.id} - {order.status}</option>)}</select></label>
 {booking&&!loading&&!error&&<>{items.map(item=><article key={item.id} className="glass-card"><h2>{item.status}</h2><p>{item.reason}</p>{item.resolution&&<p>{item.resolution}</p>}</article>)}{items.length===0&&<p>No disputes for this booking.</p>}
 {canOpen&&<form onSubmit={async event=>{event.preventDefault();if(busy)return;const form=event.currentTarget,reason=String(new FormData(form).get('reason')).trim();if(!reason)return;setBusy(true);setError("");try{await api.openDispute(booking,reason);setItems(await api.getDisputes(booking));form.reset();}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}}}><label>Reason<textarea required name="reason" maxLength={2000} disabled={busy}/></label><button className="btn-primary" disabled={busy}>{busy?'Submitting...':'Open dispute'}</button></form>}</>}
 </div>;
}
