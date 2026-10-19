import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
test("route preview sends existing Vehicle Transport service contract to authoritative estimate",()=>{
 const source=readFileSync("app/components/open-route-preview.tsx","utf8");
 assert.match(source,/fetch\("\/api\/recovery\/open-estimate"/);
 assert.match(source,/recoveryType:"Vehicle Transport",destinationMode:"transport",pickupPostcode:pickup,destinationPostcode:destination/);
 assert.match(source,/typeof data\.estimatedPriceGbp==="number"/);
});
