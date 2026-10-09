import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(p,"utf8");
test("Leaflet initialises inside a contained responsive map, preserving marker panes",()=>{
 const map=src("app/components/recovery-route-map.tsx"),css=src("app/globals.css");
 assert.match(map,/map\.setView\(\[54\.5,-3\],6\)/);
 assert.match(map,/L\.marker\(point\)\.addTo\(map\)/);
 assert.match(map,/L\.polyline\(line,/);
 assert.match(map,/map\.fitBounds\(polyline\.getBounds\(\)/);
 assert.match(map,/map\.fitBounds\(L\.latLngBounds\(points\)/);
 assert.match(map,/onReady=\{\(\)=>setLoaded\(true\)\}/);
 assert.match(css,/\.recovery-map-shell\{[^}]*isolation:isolate/);
 assert.match(css,/\.recovery-leaflet-map\{[^}]*height:clamp\(/);
 assert.doesNotMatch(css,/\.recovery-map-shell \.leaflet-pane[^\n]*z-index:auto/);
});
test("postcode locations survive unavailable routing but fabricated miles and prices do not",()=>{
 const api=src("app/api/recovery/open-estimate/route.ts");
 const wizard=src("app/recovery/request/page.tsx");
 assert.match(api,/locations=\{pickup:origin,destination:end\}/);
 assert.match(api,/unavailable\(stage,route,locations\)/);
 assert.match(api,/if\(isClientReviewDemo\(\)\)return unavailable\(stage,route,locations\)/);
 assert.match(wizard,/pickup=\{estimate\?\.locations\?\.pickup\?\?null\}/);
 assert.match(wizard,/destination=\{estimate\?\.locations\?\.destination\?\?null\}/);
 assert.match(wizard,/REQUEST SUBMISSION PAUSED/);
});
test("UK postcode validation explains format and rejects non-existent results",()=>{
 const wizard=src("app/recovery/request/page.tsx");
 assert.match(wizard,/invalid UK format\. Use a complete postcode such as SW1A 1AA/);
 assert.match(wizard,/if\(response\.status===400\|\|data\.valid===false\)/);
 assert.match(wizard,/Pickup postcode is invalid or not found/);
 assert.match(wizard,/Destination postcode is invalid or not found/);
});
