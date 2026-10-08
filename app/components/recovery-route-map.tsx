"use client";
import {useEffect,useRef} from "react";
import Script from "next/script";
type Route={coordinates:[number,number][];pickup:{latitude:number;longitude:number};destination:{latitude:number;longitude:number}};
type Leaflet={map:(element:HTMLElement)=>{setView:(center:[number,number],zoom:number)=>unknown;fitBounds:(bounds:unknown,options?:unknown)=>unknown;remove:()=>void};tileLayer:(url:string,options:Record<string,unknown>)=>{addTo:(map:unknown)=>unknown};marker:(point:[number,number])=>{addTo:(map:unknown)=>{bindPopup:(label:string)=>unknown}};polyline:(points:[number,number][],options:Record<string,unknown>)=>{addTo:(map:unknown)=>{getBounds:()=>unknown}}};
declare global{interface Window{L?:Leaflet}}
export default function RecoveryRouteMap({route}:{route:Route|null}){
 const ref=useRef<HTMLDivElement>(null),instance=useRef<{remove:()=>void}|null>(null);
 const draw=()=>{if(!ref.current||!route||!window.L)return;instance.current?.remove();const L=window.L;const map=L.map(ref.current);instance.current=map;
 L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18}).addTo(map);
 L.marker([route.pickup.latitude,route.pickup.longitude]).addTo(map).bindPopup("Pickup (approximate postcode location)");
 L.marker([route.destination.latitude,route.destination.longitude]).addTo(map).bindPopup("Destination (approximate postcode location)");
 const line=L.polyline(route.coordinates,{color:"#FF6600",weight:5}).addTo(map);map.fitBounds(line.getBounds(),{padding:[24,24]});};
 useEffect(()=>{draw();return()=>{instance.current?.remove();instance.current=null}},[route]);
 return <><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onReady={draw}/><div ref={ref} role="img" aria-label="OpenStreetMap driving route with pickup and destination markers" style={{width:"100%",height:350,borderRadius:16,overflow:"hidden",marginTop:16}}/><p style={{fontSize:13}}>Map © OpenStreetMap contributors. Tiles subject to OSM usage policy; use a suitable tile provider for production.</p></>;
}
