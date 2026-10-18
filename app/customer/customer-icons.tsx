import type {ReactNode} from "react";
export type CustomerIconName="requests"|"offers"|"bookings"|"tracking"|"history"|"quote"|"account"|"logout"|"arrow"|"shield"|"home";
export default function CustomerIcon({name,size=20}:{name:CustomerIconName;size?:number}){
 let paths:ReactNode;
 switch(name){
 case "requests":paths=<><path d="M8 4h10a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2Z"/><path d="M9 10h8M9 14h8M9 18h5M10 4V2"/></>;break;
 case "offers":paths=<><path d="m3 12 9-9 9 9-9 9-9-9Z"/><path d="M9 12h6M12 9v6"/></>;break;
 case "bookings":paths=<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16m-12 5 3 3 5-5"/></>;break;
 case "tracking":paths=<><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></>;break;
 case "history":paths=<><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l4 2"/></>;break;
 case "quote":paths=<><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></>;break;
 case "account":paths=<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>;break;
 case "logout":paths=<><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 16l4-4-4-4m4 4H9"/></>;break;
 case "arrow":paths=<><path d="M5 12h14m-6-6 6 6-6 6"/></>;break;
 case "shield":paths=<><path d="m12 2 8 4v5c0 6-3 9-8 11-5-2-8-5-8-11V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>;break;
 default:paths=<><path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-7h6v7"/></>;
 }
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths}</svg>;
}
