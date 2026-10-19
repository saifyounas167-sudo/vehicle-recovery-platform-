/** UK wall-clock schedule slots. Values are ISO UTC instants for the existing API. */
const zone="Europe/London";
const parts=(instant:Date)=>Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(instant).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
export function ukDate(instant:Date){const p=parts(instant);return p.year+"-"+p.month+"-"+p.day;}
export function ukTime(instant:Date){const p=parts(instant);return p.hour+":"+p.minute;}
export function ukTimeLabel(time:string){const [h,m]=time.split(":").map(Number);return String(h%12||12).padStart(2,"0")+":"+String(m).padStart(2,"0")+(h>=12?" PM":" AM");}
export function ukSlotInstant(day:string,time:string,now=Date.now()):string|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]\d|2[0-3]):(00|30)$/.test(time))return null;
 const [y,mo,d]=day.split("-").map(Number);if(new Date(Date.UTC(y,mo-1,d)).toISOString().slice(0,10)!==day)return null;
 const [h,m]=time.split(":").map(Number);
 const wall=Date.UTC(y,mo-1,d,h,m);
 // Both offsets are checked: missing spring-forward hour is invalid; repeated
 // autumn hour resolves to its earliest *future* occurrence.
 return [-60,0,60,120].map(offset=>wall-offset*60000).filter(ms=>ms>now&&ukDate(new Date(ms))===day&&ukTime(new Date(ms))===time).sort((a,b)=>a-b).map(ms=>new Date(ms).toISOString())[0]||null;
}
export function ukAvailableSlots(day:string,now=Date.now()){return Array.from({length:48},(_,i)=>String(Math.floor(i/2)).padStart(2,"0")+":"+(i%2?"30":"00")).filter(time=>ukSlotInstant(day,time,now)!==null);}
