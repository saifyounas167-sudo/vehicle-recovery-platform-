"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";

type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
export default function InstallAppButton({className=""}:{className?:string}){
 const [ready,setReady]=useState(false),[standalone,setStandalone]=useState(false),[ios,setIos]=useState(false),[safari,setSafari]=useState(false),[open,setOpen]=useState(false),[notice,setNotice]=useState("");
 const deferred=useRef<InstallPrompt|null>(null),trigger=useRef<HTMLButtonElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const ua=navigator.userAgent;
  setIos(/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1));
  setSafari(/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA/i.test(ua));
  const installed=()=>setStandalone(window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone===true);
  installed();setReady(true);
  const media=window.matchMedia("(display-mode: standalone)");
  media.addEventListener?.("change",installed);
  const before=(e:Event)=>{e.preventDefault();deferred.current=e as InstallPrompt;};
  const appInstalled=()=>{deferred.current=null;setStandalone(true);setOpen(false);};
  window.addEventListener("beforeinstallprompt",before);
  window.addEventListener("appinstalled",appInstalled);
  return()=>{media.removeEventListener?.("change",installed);window.removeEventListener("beforeinstallprompt",before);window.removeEventListener("appinstalled",appInstalled);};
 },[]);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);if(e.key==="Tab"){const root=document.getElementById("install-instructions-dialog");const nodes=Array.from(root?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]')||[]);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);(trigger.current||previous)?.focus()};},[open]);
 async function install(){
  if(standalone)return;
  if(!ios&&deferred.current){const event=deferred.current;deferred.current=null;try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==="dismissed")setNotice("Installation cancelled. You can try again or follow the steps below.");}catch{setNotice("Browser installation prompt is unavailable. Follow the instructions below.");setOpen(true)}return;}
  setNotice("");setOpen(true);
 }
 return <><button ref={trigger} type="button" className={"install-app-button "+className} onClick={install} disabled={standalone} aria-label={standalone?"App already installed":"Install UK Recovery app"}><span aria-hidden="true">⇩</span> {standalone?"App Already Installed":"Install App"}</button>{ready&&notice&&<span role="status" className="pwa-install-notice">{notice}</span>}
 {ready&&open&&createPortal(<div className="pwa-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section id="install-instructions-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-dialog-title" className="pwa-dialog"><button ref={close} className="pwa-dialog-close" type="button" onClick={()=>setOpen(false)} aria-label="Close installation instructions">×</button><span className="pwa-dialog-kicker">UK RECOVERY · HOME SCREEN</span><h2 id="pwa-dialog-title">Add UK Recovery to your phone</h2><p>Get convenient home-screen access to our recovery website. No App Store download is needed.</p>{ios?<><h3>iPhone / iPad</h3>{!safari&&<p className="pwa-browser-warning">You appear to be using another browser or an in-app browser. Open this page directly in Safari first.</p>}<ol><li>Open this website in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> icon.</li><li>Select <strong>Add to Home Screen</strong>.</li><li>Enable <strong>Open as Web App</strong>, if offered.</li><li>Tap <strong>Add</strong>.</li></ol></>:<><h3>Android / other browsers</h3><ol><li>Open this website in <strong>Chrome</strong> (or a compatible browser).</li><li>Open the browser menu <strong>⋮</strong>.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong> if available.</li><li>Confirm using your browser’s installation dialog.</li></ol><p>Installation support varies by device and browser.</p></>}<button className="pwa-dialog-done" type="button" onClick={()=>setOpen(false)}>Got it</button></section></div>,document.body)}</>;
}
