import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const home=readFileSync("app/page.tsx","utf8");
const nearby=readFileSync("app/recovery/nearby/page.tsx","utf8");
const form=readFileSync("app/recovery/request/page.tsx","utf8");
test("three homepage choices and expandable quote",()=>{
 for(const text of ["Get Recovery Quote","Find Recovery Near Me","Join as a Recovery Driver","aria-expanded={quoteOpen}","quoteOpen&&<form","pickupRef.current?.focus()","/driver/register","/recovery/nearby"])assert.ok(home.includes(text),text);
 assert.ok(home.includes('q.set("pickup",pickup)'));assert.ok(home.includes('q.set("destination",destination)'));
});
test("nearby postcode/GPS search reuses existing map and makes no private DB query",()=>{
 for(const text of ["RecoveryRouteMap","/api/recovery/postcode?postcode=","/api/recovery/postcode?lat=","navigator.geolocation.getCurrentPosition","data.valid!==true","Verified company listings are not available","encodeURIComponent(postcode)","/recovery/request"])assert.ok(nearby.includes(text),text);
 assert.ok(!nearby.includes("supabase"));assert.ok(!nearby.includes("service_role"));assert.ok(!nearby.includes("from(\"driver_profiles\")"));
});
test("existing form remains 5 steps in read-only client demo",()=>{
 assert.ok(form.includes('const steps=["Location","Vehicle","Recovery","Customer","Review"]'));
 assert.ok(form.includes("const clientReview=true"));
});
