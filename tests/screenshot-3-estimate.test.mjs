import test from "node:test";
import assert from "node:assert/strict";
import {calculateEstimate} from "../src/lib/pricing.ts";
import {requiresDestination,recoveryServices} from "../src/lib/recovery-service-rules.ts";
import {readFileSync} from "node:fs";

test("approved £5 callout plus £3 per verified road mile, including decimals",()=>{
 const quote=miles=>calculateEstimate({baseFee:5,distanceMiles:miles,distanceRate:3}).estimateGbp;
 for(const [miles,amount] of [[5,20],[10,35],[20,65],[42,131],[1.235,8.71]])
  assert.equal(quote(miles),amount);
 const server=readFileSync("src/lib/recovery-pricing.ts","utf8");
 assert.match(server,/calculateEstimate\(\{baseFee:config\.minimumCallout,distanceMiles:miles,distanceRate:config\.pricePerMile/);
});
test("zero, negative and non-finite routes are rejected by server pricing",()=>{
 const source=readFileSync("src/lib/recovery-pricing.ts","utf8");
 assert.match(source,/!Number\.isFinite\(miles\)\|\|miles<=0/);
 assert.match(source,/throw Error\("Verified road distance required"\)/);
});
test("only transport services are eligible for distance estimates",()=>{
 assert.equal(recoveryServices.length,10);
 for(const service of ["Jump Start / Flat Battery Assistance","Flat Tyre Assistance"])
  assert.equal(requiresDestination(service,"transport"),false);
 assert.equal(requiresDestination("Breakdown Recovery","Roadside Assistance Without Transport"),false);
 assert.equal(requiresDestination("Breakdown Recovery","transport"),true);
 assert.equal(requiresDestination("Car Towing","transport"),true);
});
test("estimate UI requires valid road distance and never displays example reference prices",()=>{
 const component=readFileSync("app/components/estimate-result.tsx","utf8");
 assert.match(component,/available===true&&validDistance/);
 assert.doesNotMatch(component,/95.?140|39\.99/);
 assert.match(component,/Price to be confirmed by recovery drivers/);
 assert.match(component,/No driver has been booked/);
});
