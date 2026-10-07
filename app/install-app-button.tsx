"use client";
import { useEffect, useState } from "react";
export default function InstallAppButton({className=""}:{className?:string}){
 const [prompt,setPrompt]=useState<any>(null); const [ios,setIos]=useState(false);
 useEffect(()=>{setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));const h=(e:any)=>{e.preventDefault();setPrompt(e)};window.addEventListener("beforeinstallprompt",h);return()=>window.removeEventListener("beforeinstallprompt",h)},[]);
 async function install(){if(prompt){await prompt.prompt();setPrompt(null);return;}document.getElementById("install-app")?.scrollIntoView({behavior:"smooth"});}
 return <button type="button" className={"install-app-button "+className} onClick={install} aria-label="Install UK Recovery app"><span aria-hidden>⇩</span> Install App{ios&&<small>iPhone guide</small>}</button>
}