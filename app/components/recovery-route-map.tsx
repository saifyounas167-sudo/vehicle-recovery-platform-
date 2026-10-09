"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Script from "next/script";

type Point={latitude:number;longitude:number};
type Route={coordinates:[number,number][];pickup:Point;destination:Point};
type MapInstance={setView:(center:[number,number],zoom:number)=>unknown;fitBounds:(bounds:unknown,options?:unknown)=>unknown;invalidateSize:()=>void;remove:()=>void};
type Leaflet={
 map:(element:HTMLElement,options?:Record<string,unknown>)=>MapInstance;
 tileLayer:(url:string,options:Record<string,unknown>)=>{addTo:(map:MapInstance)=>unknown};
 marker:(point:[number,number])=>{addTo:(map:MapInstance)=>{bindPopup:(label:string)=>unknown}};
 polyline:(points:[number,number][],options:Record<string,unknown>)=>{addTo:(map:MapInstance)=>{getBounds:()=>unknown}};
 latLngBounds:(points:[number,number][])=>unknown;
};
declare global{interface Window{L?:Leaflet}}
const valid=(p?:Point|null)=>!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)
 &&p.latitude>=49&&p.latitude<=61&&p.longitude>=-9&&p.longitude<=3;
export default function RecoveryRouteMap({route,pickup,destination}:{route:Route|null;pickup?:Point|null;destination?:Point|null}){
 const ref=useRef<HTMLDivElement>(null),mapRef=useRef<MapInstance|null>(null),[loaded,setLoaded]=useState(false);
 const draw=useCallback(()=>{
  const el=ref.current,L=window.L;
  if(!el||!L)return;
  // Remove the previous Leaflet instance before reusing its DOM element.
  mapRef.current?.remove();mapRef.current=null;
  const map=L.map(el,{scrollWheelZoom:false});
  mapRef.current=map;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
   maxZoom:18
  }).addTo(map);
  const a=route?.pickup??pickup,d=route?.destination??destination;
  const points:[number,number][]=[];
  if(valid(a)){const point:[number,number]=[a!.latitude,a!.longitude];points.push(point);
   L.marker(point).addTo(map).bindPopup("Pickup postcode centre");}
  if(valid(d)){const point:[number,number]=[d!.latitude,d!.longitude];points.push(point);
   L.marker(point).addTo(map).bindPopup("Destination postcode centre");}
  const line=route?.coordinates;
  if(line&&line.length>=2&&line.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]))){
   const polyline=L.polyline(line,{color:"#f97316",weight:5,opacity:.9}).addTo(map);
   map.fitBounds(polyline.getBounds(),{padding:[35,35],maxZoom:15});
  }else if(points.length===2){
   map.fitBounds(L.latLngBounds(points),{padding:[42,42],maxZoom:15});
  }else if(points.length===1)map.setView(points[0],12);
  else map.setView([54.5,-3],6); // centered on the United Kingdom, not the world
  requestAnimationFrame(()=>map.invalidateSize());
 },[route,pickup,destination]);
 useEffect(()=>{
  if(loaded||window.L)draw();
  return ()=>{mapRef.current?.remove();mapRef.current=null;};
 },[loaded,draw]);
 return <section className="recovery-map-shell" aria-label="UK recovery route map">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive"
   onReady={()=>setLoaded(true)}/>
  <div ref={ref} className="recovery-leaflet-map" role="img"
   aria-label={route?"Driving route with pickup and destination pins":valid(pickup)&&valid(destination)?"Verified postcode pins; road route pending":"Map centred on the UK; enter pickup and destination postcodes"}/>
  <p role="status">{route?"Road route shown using verified driving directions.":
   valid(pickup)&&valid(destination)?"Pickup and destination markers verified. Driving route currently unavailable.":
   "Enter valid UK pickup and destination postcodes to display location markers and a road route."}</p>
  <p className="recovery-map-attribution">Postcode pins show approximate postcode centres, not exact addresses. © OpenStreetMap contributors.</p>
 </section>;
}
