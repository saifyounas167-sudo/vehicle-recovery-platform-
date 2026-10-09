"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import InstallAppButton from "../install-app-button";

const nav=[["Home","/"],["Get a Quote","/recovery/request"],["How It Works","/how-it-works"],["About","/about"]] as const;
const Icon=({type}:{type:"globe"|"user"|"business"|"truck"|"shield"})=>{
 const paths={globe:<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12s1.2 6.5 3.6 9"/></>,user:<><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></>,business:<><path d="M4 21V7h10v14M14 11h6v10M7 10h2M11 10h1M7 14h2M11 14h1M7 18h2M17 14h1M17 18h1"/></>,truck:<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,shield:<><path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z"/><path d="M9.5 12l1.7 1.7 3.5-3.7"/></>};return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
};
export default function PublicHeader(){
 const pathname=usePathname();const [open,setOpen]=useState(false);
 const active=(href:string)=>href==="/" ? pathname==="/" : pathname.startsWith(href);
 const close=()=>setOpen(false);
 return <header className="uk-header global-public-header"><div className="uk-nav">
  <Link href="/" className="uk-logo" aria-label="UK Recovery home"><span>UK</span><b>Recovery</b></Link>
  <nav className="public-main-nav" aria-label="Main navigation">{nav.map(([label,href])=><Link key={href} href={href} className={active(href)?"active":""}>{label}</Link>)}</nav>
  <div className="public-actions">
   <button className="language-control" type="button" aria-label="Language: English"><Icon type="globe"/> <span>English</span><b>⌄</b></button>
   <Link href="/login?role=customer" className="account-link customer-login"><Icon type="user"/>Customer Login</Link>
   <Link href="/login?mode=signup&role=customer" className="get-started">GET STARTED</Link>
   <Link href="/login?role=business" className="role-login"><Icon type="business"/>Business Login</Link>
   <Link href="/login?role=driver" className="role-login"><Icon type="truck"/>Driver Login</Link>
   <Link href="/login?role=admin" className="account-link admin-login"><Icon type="shield"/>Admin Login</Link>
   <InstallAppButton className="header-install"/>
  </div>
  <div className="public-mobile-actions"><Link href="/recovery/request" className="mobile-recovery-start">Get Started</Link><button className="uk-menu" type="button" aria-expanded={open} aria-controls="public-mobile-menu" onClick={()=>setOpen(v=>!v)} aria-label={open?"Close menu":"Open menu"}>{open?"×":"☰"}</button></div>
 </div>
 <div id="public-mobile-menu" className={"public-mobile-menu "+(open?"open":"")}>
  {nav.map(([label,href])=><Link key={href} href={href} className={active(href)?"active":""} onClick={close}>{label}</Link>)}
  <button className="mobile-language" type="button"><Icon type="globe"/>English <span>⌄</span></button>
  <div className="mobile-account-group">
   <Link href="/login?role=customer" onClick={close}><Icon type="user"/>Customer Login</Link>
   <Link href="/login?mode=signup&role=customer" className="get-started" onClick={close}>GET STARTED</Link>
   <Link href="/login?role=business" className="role-login" onClick={close}><Icon type="business"/>Business Login</Link>
   <Link href="/login?role=driver" className="role-login" onClick={close}><Icon type="truck"/>Driver Login</Link>
   <Link href="/login?role=admin" onClick={close}><Icon type="shield"/>Admin Login</Link>
  </div>
 </div>
 </header>
}