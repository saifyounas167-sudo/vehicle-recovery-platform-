export interface Coordinates{latitude:number;longitude:number}
export interface RouteEstimate{distanceMiles:number;durationMinutes?:number}
export async function getRouteEstimate(origin:string|Coordinates,destination:string|Coordinates):Promise<RouteEstimate>{
 const key=process.env.GOOGLE_MAPS_SERVER_API_KEY;
 if(!key)throw new Error("Maps provider is not configured");
 const waypoint=(v:string|Coordinates)=>typeof v==="string"?{address:v+", UK"}:{location:{latLng:{latitude:v.latitude,longitude:v.longitude}}};
 const response=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":key,"X-Goog-FieldMask":"routes.distanceMeters,routes.duration"},body:JSON.stringify({origin:waypoint(origin),destination:waypoint(destination),travelMode:"DRIVE",routingPreference:"TRAFFIC_UNAWARE",units:"IMPERIAL"}),cache:"no-store",signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw new Error("Routing provider failed");
 const body=await response.json();const meters=body.routes?.[0]?.distanceMeters;
 if(typeof meters!=="number"||meters<0)throw new Error("No driving route available");
 return {distanceMiles:Math.round(meters/1609.344*100)/100};
}
