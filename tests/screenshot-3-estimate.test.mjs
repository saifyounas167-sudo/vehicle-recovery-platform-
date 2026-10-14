import test from "node:test";
import assert from "node:assert/strict";
import {calculateRecoveryPrice,validPricingConfig,pricingKeys} from "../src/lib/recovery-pricing.ts";
import {requiresDestination,recoveryServices} from "../src/lib/recovery-service-rules.ts";
import {readFileSync} from "node:fs";

const config=Object.fromEntries(pricingKeys.map(key=>[key,0]));
config.minimumCallout=5;
config.pricePerMile=3;
const flags={vehicleType:"Car",nonRunning:false,lockedWheels:false,accident:false,urgent:false,night:false,weekend:false,bankHoliday:false,loadingDifficulty:false,specialEquipment:false};

test("approved staging pricing £5 + £3 per verified road mile, including decimals",()=>{
 assert.equal(validPricingConfig(config),true);
 for(const [miles,amount] of [[5,20],[10,35],[20,65],[42,131],[1.235,8.71]]){
  assert.equal(calculateRecoveryPrice(config,miles,flags).estimateGbp,amount);
 }
});
test("zero, negative and non-finite routes cannot produce an estimate",()=>{
 for(const distance of [0,-1,NaN,Infinity,-Infinity])
  assert.throws(()=>calculateRecoveryPrice(config,distance,flags),/Verified road distance required/);
});
test("only transport services are eligible for distance estimates",()=>{
 assert.equal(recoveryServices.length,10);
 for(const service of ["Jump Start / Flat Battery Assistance","Flat Tyre Assistance"])
  assert.equal(requiresDestination(service,"transport"),false);
 assert.equal(requiresDestination("Breakdown Recovery","Roadside Assistance Without Transport"),false);
 assert.equal(requiresDestination("Breakdown Recovery","transport"),true);
 assert.equal(requiresDestination("Car Towing","transport"),true);
});
test("estimate UI requires real positive distance and does not display example client pricing",()=>{
 const component=readFileSync("app/components/estimate-result.tsx","utf8");
 assert.match(component,/available===true&&validDistance/);
 assert.doesNotMatch(component,/95.?140|39\.99/);
 assert.match(component,/Price to be confirmed by recovery drivers/);
 assert.match(component,/No driver has been booked/);
});
