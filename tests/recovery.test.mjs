import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateEstimate} from "../src/lib/pricing.ts";
test("pricing uses configured mileage and charges without invented rates",()=>{
 const result=calculateEstimate({baseFee:25,distanceMiles:12,distanceRate:2,equipmentFee:7});
 assert.equal(result.estimateGbp,56);
 assert.equal(result.breakdown.distanceFee,24);
});
test("form has exactly ten approved services and no scrap",()=>{
 const source=readFileSync("app/recovery/request/page.tsx","utf8");
 const match=source.match(/const services=\[([^\]]+)\]/);
 assert.ok(match);
 const services=[...match[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
 assert.equal(services.length,10);
 assert.ok(!services.some(s=>/scrap/i.test(s)));
});
test("guest private contacts have RLS and no anonymous grants",()=>{
 const source=readFileSync("supabase/migrations/0003_guest_recovery_jobs.sql","utf8");
 assert.match(source,/recovery_job_private_contacts enable row level security/i);
 assert.match(source,/revoke all on public.recovery_job_private_contacts from anon, authenticated/i);
});
test("photo bucket is private",()=>{
 const source=readFileSync("supabase/migrations/0004_private_recovery_photos.sql","utf8");
 assert.match(source,/recovery-vehicle-photos',false/);
});
