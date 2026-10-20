"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import AccountNavigation from "./account-navigation";
import {isDashboardPreviewEnabled} from "@/src/lib/dashboard-preview";

type MenuIcon="home"|"quote"|"services"|"how"|"drivers"|"pricing"|"about"|"login"|"user"|"shield"|"preview";
const iconPaths:Record<MenuIcon,string>={
 home:"m3 10 9-7 9 7v10H3z M9 20v-6h6v6",
 quote:"M4 3h16v18H4z M8 8h8 M8 12h8 M8 16h5",
 services:"M3 8h11v9H3z M14 11h4l3 3v3h-7z M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
 how:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
 drivers:"M4 16l2-8h12l2 8 M4 16h16v3H4z M7 19v2 M17 19v2",
 pricing:"M12 3 3 12l9 9 9-9z M12 8v8 M9 11h6",
 about:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 11v6 M12 7v1",
 login:"M10 17l5-5-5-5 M15 12H3 M13 3h8v18h-8",
 user:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M5 21v-2a7 7 0 0 1 14 0v2",
 shield:"M12 3l7 3v5c0 5-2.5 8-7 10-4.5-2-7-5-7-10V6z M9 12l2 2 4-4",
 preview:"M3 4h18v15H3z M8 23h8 M12 19v4"
};
function Icon({name}:{name:MenuIcon}){return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name]}/></svg>;}
const mainItems:{label:string;icon:MenuIcon;href:string}[]=[
 {label:"Home",icon:"home",href:"/"},
 {label:"Get Recovery Quote",icon:"quote",href:"/recovery/request"},
 {label:"Services",icon:"services",href:"/#services"},
 {label:"How It Works",icon:"how",href:"/how-it-works"}
];
export default function PublicMobileMenu({open,onClose}:{open:boolean;onClose:()=>void}){
 const pathname=usePathname(),[driversOpen,setDriversOpen]=useState(false);
 const dialog=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null),previous=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!open)return;previous.current=document.activeElement as HTMLElement;closeRef.current?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();if(e.key==="Tab"&&dialog.current){
   const focusable=[...dialog.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
   if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }};
  document.addEventListener("keydown",key);const prior=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{document.removeEventListener("keydown",key);document.body.style.overflow=prior;previous.current?.focus();};
 },[open,onClose]);
 const link=(label:string,href:string,icon:MenuIcon)=><Link href={href} key={label} className={"ss12-link "+(pathname===href?"ss12-current":"")} onClick={onClose}><Icon name={icon}/><span>{label}</span></Link>;
 return <div id="public-mobile-menu" ref={dialog} className={"ss12-menu "+(open?"ss12-open":"")} role="dialog" aria-modal="true" aria-label="UK Recovery mobile navigation" aria-hidden={!open}>
  <div className="ss12-head"><Link href="/" onClick={onClose} className="ss12-logo" tabIndex={open?0:-1}><span>UK</span> Recovery</Link><button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" tabIndex={open?0:-1}>×</button></div>
  <nav className="ss12-links" aria-label="Mobile main navigation">
   {mainItems.map(x=>link(x.label,x.href,x.icon))}
   <button type="button" className="ss12-link ss12-expand" aria-expanded={driversOpen} aria-controls="ss12-driver-links" onClick={()=>setDriversOpen(v=>!v)}><Icon name="drivers"/><span>For Drivers</span><span className={"ss12-chevron "+(driversOpen?"ss12-rotated":"")}>⌄</span></button>
   {driversOpen&&<div id="ss12-driver-links" className="ss12-submenu">
    {link("Driver Registration","/driver/register","drivers")}
    {link("Driver Membership / Pricing","/driver/pricing","pricing")}
   </div>}
   {link("About","/about","about")}
   <section className="ss12-account-links" aria-label="Account access">
    <div className="ss12-section-label">ACCOUNT ACCESS</div>
    {link("Customer Login","/login?role=customer","user")}
    {link("Driver Login","/login?role=driver","drivers")}
    {link("Admin Login","/login?role=admin","shield")}
   </section>
  </nav>
  <div className="ss12-bottom">
   {isDashboardPreviewEnabled()&&<Link href="/preview" className="ss12-preview" onClick={onClose}><Icon name="preview"/>Dashboard Preview Mode →</Link>}
   <Link href="/login?role=customer&mode=signup" className="ss12-login" onClick={onClose}><Icon name="user"/>Create Customer Account</Link>
   <div className="ss12-account-state"><AccountNavigation mobile onNavigate={onClose}/></div>
  </div>
 </div>;
}
