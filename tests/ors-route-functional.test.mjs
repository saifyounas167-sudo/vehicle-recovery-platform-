import test from "node:test";
import assert from "node:assert/strict";
import {metresToMiles,parseOsrmRoute,previewDrivingRoute,resolvePostcode} from "../src/lib/open-routing.ts";

test("UK postcodes resolve to provider coordinates, ORS roads produce miles and geometry",async()=>{
 const oldFetch=globalThis.fetch,oldProvider=process.env.ROUTING_PROVIDER,oldKey=process.env.ORS_API_KEY;
 const calls=[];
 try{
  process.env.ROUTING_PROVIDER="ors";
  process.env.ORS_API_KEY="local-mock-only";
  globalThis.fetch=async(input,init)=>{
   const url=String(input);calls.push(url);
   if(url.includes("api.postcodes.io")){
    assert.equal(init?.cache,"no-store");
    const isPickup=url.includes("SW1A");
    return {ok:true,json:async()=>({result:{latitude:isPickup?51.501:-51.501+103,longitude:isPickup?-0.142:-0.135}})};
   }
   assert.equal(url,"https://api.openrouteservice.org/v2/directions/driving-car/geojson");
   assert.equal(init.method,"POST");
   assert.equal(init.headers.Authorization,"local-mock-only");
   const body=JSON.parse(init.body);
   assert.equal(body.coordinates.length,2);
   return {ok:true,json:async()=>({features:[{properties:{summary:{distance:4828.032,duration:600}},geometry:{coordinates:[[-0.142,51.501],[-0.139,51.5],[-0.135,51.501]]}}]})};
  };
  const [origin,destination]=await Promise.all([resolvePostcode("SW1A 1AA"),resolvePostcode("W1A 1AA")]);
  const route=await previewDrivingRoute(origin,destination);
  assert.equal(route.distanceMiles,3);
  assert.equal(route.durationMinutes,10);
  assert.deepEqual(route.coordinates[0],[51.501,-0.142]);
  assert.equal(calls.length,3);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldProvider===undefined)delete process.env.ROUTING_PROVIDER;else process.env.ROUTING_PROVIDER=oldProvider;
  if(oldKey===undefined)delete process.env.ORS_API_KEY;else process.env.ORS_API_KEY=oldKey;
 }
});
test("invalid route is rejected instead of inventing mileage",()=>{
 assert.equal(metresToMiles(1609.344),1);
 assert.throws(()=>parseOsrmRoute({code:"Ok",routes:[{distance:0,duration:0,geometry:{coordinates:[]}}]},{latitude:51,longitude:0},{latitude:52,longitude:0}),/No valid road route/);
});
