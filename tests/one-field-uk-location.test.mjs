import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("single UK location search per pickup and drop-off, optional landmark",()=>{
 const form=read("app/recovery/request/page.tsx");
 assert.match(form,/UkLocationSearch label="Pickup Location"/);
 assert.match(form,/UkLocationSearch label="Drop-off Location"/);
 assert.doesNotMatch(form,/field\("pickupPostcode"/);
 assert.doesNotMatch(form,/field\("destinationPostcode"/);
 assert.doesNotMatch(form,/field\("pickupAddress"[^)]*true/);
 assert.match(form,/Add address or nearest landmark \(optional\)/);
 assert.match(form,/Add drop-off address or landmark \(optional\)/);
});
test("frontend and backend permit valid postcode without street address",()=>{
 const rules=read("src/lib/recovery-service-rules.ts");
 const api=read("app/api/recovery/jobs/route.ts");
 assert.doesNotMatch(rules,/if\(!value\(input\.pickupAddress\)\)/);
 assert.doesNotMatch(api,/if\(!text\(b\.pickupAddress,250\)\)/);
 assert.match(api,/pickup_address:text\(b\.pickupAddress,250\)\|\|null/);
 assert.match(api,/destination_address:mode==="transport"\?text\(b\.destinationAddress,250\)\|\|null:null/);
 assert.match(rules,/requiresDestination/);
 assert.match(api,/resolvePostcode\(pickup\)/);
});
test("autocomplete and GPS are still available and no guessed street address",()=>{
 const input=read("app/components/uk-location-search.tsx");
 const form=read("app/recovery/request/page.tsx");
 assert.match(input,/location-suggest\?q=/);
 assert.match(form,/onClick=\{locate\}/);
 assert.match(form,/item\.postcode&&\["building","amenity","street"\]\.includes\(item\.kind\)/);
 assert.match(form,/pickupAddress:""\}\)/);
});
