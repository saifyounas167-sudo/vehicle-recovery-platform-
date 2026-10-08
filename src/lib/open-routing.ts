export type Point={latitude:number;longitude:number};
export type RoadRoute={distanceMiles:number;durationMinutes:number;coordinates:[number,number][];pickup:Point;destination:Point};
export function metresToMiles(metres:number){if(!Number.isFinite(metres)||metres<0)throw Error("Invalid route distance");return Number((metres/1609.344).toFixed(2))}
export function parseOsrmRoute(value:unknown,pickup:Point,destination:Point):RoadRoute{
 const v=value as {code?:string;routes?:{distance:number;duration:number;geometry?:{coordinates:[number,number][]}}[]};
 const route=v?.routes?.[0];if(v?.code!=="Ok"||!route||!Number.isFinite(route.distance)||route.distance<=0||!Number.isFinite(route.duration)||!Array.isArray(route.geometry?.coordinates)||route.geometry.coordinates.length<2)throw Error("No valid road route");
 return {distanceMiles:metresToMiles(route.distance),durationMinutes:Math.ceil(route.duration/60),coordinates:route.geometry.coordinates.map(([lon,lat])=>[lat,lon]),pickup,destination};
}
export async function resolvePostcode(postcode:string):Promise<Point>{
 if(!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(postcode.trim()))throw Error("Invalid UK postcode");
 const res=await fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(postcode.trim()),{cache:"no-store",signal:AbortSignal.timeout(6000)});
 if(!res.ok)throw Error("Postcode lookup unavailable");
 const data=await res.json();const {latitude,longitude}=data.result||{};
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw Error("Invalid postcode coordinates");
 return {latitude,longitude};
}
export async function previewDrivingRoute(pickup:Point,destination:Point):Promise<RoadRoute>{
 const configured=process.env.ROUTING_PROVIDER_URL;
 if(!configured)throw Error("Routing provider not configured");
 const base=new URL(configured);
 if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash||!base.hostname||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|router\.project-osrm\.org$|routing\.openstreetmap\.de$)/i.test(base.hostname))throw Error("Unsafe routing endpoint");
 const endpoint=new URL(base.pathname.replace(/\/$/,"")+"/route/v1/driving/"+pickup.longitude+","+pickup.latitude+";"+destination.longitude+","+destination.latitude,base.origin);
 endpoint.searchParams.set("overview","full");endpoint.searchParams.set("geometries","geojson");
 const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(9000),headers:{"Accept":"application/json"}});
 if(!response.ok)throw Error("Routing provider unavailable");
 return parseOsrmRoute(await response.json(),pickup,destination);
}
