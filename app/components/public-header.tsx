"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import InstallAppButton from "../install-app-button";

const nav=[["Home","/"],["Get a Quote","/recovery/request"],["How It Works","/how-it-works"],["About","/about"]] as const;
export default function PublicHeader(){
 const pathname=usePathname(); const [open,setOpen]=useState(false);
 const active=(href:string)=>href==="/" ? pathname==="/" : pathname.startsWith(href);
 return <header className="uk-header global-public-header"><div className="uk-nav">
  <Link href="/" className="uk-logo" aria-label="UK Recovery home"><span>UK</span><b>Recovery</b></Link>
  <nav className="public-main-nav" aria-label="Main navigation">{nav.map(([label,href])=><Link key={href} href={href} className={active(href)?"active":""}>{label}</Link>)}</nav>
  <div className="public-actions">
   <button className="language-control" type="button" aria-label="Language: English">English <span>⌄</span></button>
   <Link href="/login" className="account-link">Customer Login</Link>
   <Link href="/login?mode=signup" className="get-started">GET STARTED</Link>
   <Link href="/login" className="account-link">Business Login</Link>
   <Link href="/login" className="account-link">Driver Login</Link>
   <Link href="/login" className="account-link">Admin Login</Link>
   <InstallAppButton className="header-install"/>
  </div>
  <div className="public-mobile-actions"><InstallAppButton className="header-install"/><button className="uk-menu" type="button" aria-expanded={open} aria-controls="public-mobile-menu" onClick={()=>setOpen(!open)} aria-label={open?"Close menu":"Open menu"}>{open?"×":"☰"}</button></div>
 </div>
 <div id="public-mobile-menu" className={"public-mobile-menu "+(open?"open":"")}>{nav.map(([label,href])=><Link key={href} href={href} className={active(href)?"active":""} onClick={()=>setOpen(false)}>{label}</Link>)}<button className="mobile-language" type="button">English <span>⌄</span></button><div className="mobile-account-group"><Link href="/login">Customer Login</Link><Link href="/login?mode=signup" className="get-started">GET STARTED</Link><Link href="/login">Business Login</Link><Link href="/login">Driver Login</Link><Link href="/login">Admin Login</Link></div></div>
 </header>
}