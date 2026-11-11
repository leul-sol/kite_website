"use client";
import {useCallback,useEffect,useState} from "react";
import {api,type PolicyState} from "../../../services/api";
import styles from "../operations.module.css";

// Provider-only. Platform controls, settlement review and the policy audit live in kite_admin.
export default function PoliciesPage(){
 const [caps,setCaps]=useState<{platformControl:boolean;providerControl:boolean}>(),[platform,setPlatform]=useState<PolicyState>(),[own,setOwn]=useState<PolicyState>(),[terms,setTerms]=useState<Record<string,unknown>>(),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[preset,setPreset]=useState("custom");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const c=await api.getPolicyCapabilities();setCaps(c);setPlatform(await api.getPlatformPolicy());if(c.providerControl){const p=await api.getOwnPolicy();setOwn(p.provider);setTerms(p.effective.terms);}}catch(cause){setError((cause as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!platform)return;const data=new FormData(event.currentTarget);setBusy(true);setError("");setMessage("");
  const number=(key:string)=>Number(data.get(key));
  const rules={cancellationNoticeHours:number("cancellationNoticeHours"),rescheduleNoticeHours:number("rescheduleNoticeHours"),rentalDays:number("rentalDays")};
  try{await api.saveOwnPolicy({expectedVersion:own?.version??0,expectedPlatformVersion:platform.version,reason:String(data.get("reason")),rules});await load();setMessage("Policy saved for future bookings. Existing bookings retain their accepted terms.");}catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
 }
 const rules=platform?.rules;
 const fields=(values:Record<string,unknown>,maxHours:number,maxDays:number)=><>
  <label>Cancellation notice hours<input name="cancellationNoticeHours" type="number" min={0} max={maxHours} step={1} required defaultValue={String(values.cancellationNoticeHours)}/></label>
  <label>Reschedule notice hours<input name="rescheduleNoticeHours" type="number" min={0} max={maxHours} step={1} required defaultValue={String(values.rescheduleNoticeHours)}/></label>
  <label>Maximum rental days<input name="rentalDays" type="number" min={1} max={maxDays} step={1} required defaultValue={String(values.rentalDays)}/></label>
 </>;
 return <div className={styles.page}><h1 className="h1">Business policies</h1><p>Changes apply to future bookings. Rental deadlines use 00:00 UTC on the start date. Approved cancellations refund 100% to the customer&apos;s Kite wallet. No custom formulas, automatic late fees or provider-controlled deposit deductions are available.</p>
 {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}{loading&&<p role="status">Loading policies...</p>}<button className="btn-secondary" disabled={busy||loading} onClick={()=>void load()}>Reload policies</button>
 {rules&&!loading&&<section className="glass-card" style={{padding:20}}><h2>Platform policy version {platform.version}</h2><p>Provider customization: {rules.providerCustomization?"Enabled":"Disabled"}. Maximum notice: {String(rules.maxNoticeHours)} hours. Maximum rental: {String(rules.maxRentalDays)} days. Earnings and remaining deposits require {String(rules.earningsApproval)==="ADMIN_APPROVAL"?"independent admin approval":"customer confirmation or independent admin approval"} after rental completion.</p></section>}
 {!loading&&caps?.providerControl&&terms&&rules&&<section><h2>Your rental policy</h2>{rules.providerCustomization!==true?<p>The platform currently uses mandatory defaults. Provider customization is disabled.</p>:<><label>Policy preset<select aria-label="Policy preset" value={preset} disabled={busy} onChange={event=>setPreset(event.target.value)}><option value="custom">Custom</option><option value="0">Flexible: 0 hours</option><option value="24">Moderate: 24 hours</option><option value="72">Strict: 72 hours</option></select></label><form key={`provider-${own?.version}-${platform.version}-${preset}`} onSubmit={event=>void save(event)}><fieldset disabled={busy}><legend>Provider terms within platform limits</legend>{fields({...terms,...(preset!=="custom"?{cancellationNoticeHours:Number(preset),rescheduleNoticeHours:Number(preset)}:{})},Number(rules.maxNoticeHours),Number(rules.maxRentalDays))}<p>{terms.providerOverrideApplied===true?"Your saved override is active.":"Platform defaults apply until a valid provider override is saved."}</p><label>Change reason<textarea name="reason" required maxLength={1000}/></label><label><input style={{width:"auto"}} required type="checkbox"/>I confirm this policy change for future bookings</label><button className="btn-primary">Save provider policy</button></fieldset></form></>}</section>}
 </div>;
}
