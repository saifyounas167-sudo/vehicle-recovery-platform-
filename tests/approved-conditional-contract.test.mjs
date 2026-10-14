import test from "node:test";
import assert from "node:assert/strict";
import {recoveryServices,getServiceRules,requiresDestination,validateRecoveryDetails} from "../src/lib/recovery-service-rules.ts";

const valid={pickupPostcode:"SW1A 1AA",pickupAddress:"Downing Street, London",recoveryType:"Car Towing",vehicleType:"Car",destinationPostcode:"M1 1AA",destinationMode:"transport",runningStatus:"Running",rollingStatus:"Yes",passengerCount:"0",timing:"urgent",customerName:"Example Customer",phone:"07123456789"};
test("all ten canonical services have a typed service rule",()=>{
 assert.equal(recoveryServices.length,10);
 assert.equal(new Set(recoveryServices).size,10);
 for(const service of recoveryServices)assert.ok(getServiceRules(service),service);
});
for(const service of recoveryServices){
 test(service+" applies approved required fields",()=>{
  const rule=getServiceRules(service);
  const input={...valid,recoveryType:service,destinationMode:rule.destination==="none"?"Roadside Assistance Without Transport":"transport",accident:rule.accident?"No":""};
  assert.equal(validateRecoveryDetails(input),null,"valid example should pass: "+service);
  assert.match(validateRecoveryDetails({...input,customerName:""}),/full name/);
  assert.match(validateRecoveryDetails({...input,phone:"invalid"}),/UK mobile/);
  assert.match(validateRecoveryDetails({...input,vehicleType:""}),/vehicle type/);
  if(rule.destination==="required")assert.match(validateRecoveryDetails({...input,destinationPostcode:""}),/destination postcode/);
  if(rule.destination==="none"){
   assert.equal(requiresDestination(service,input.destinationMode),false);
   assert.equal(validateRecoveryDetails({...input,destinationPostcode:"",runningStatus:"",rollingStatus:"",passengerCount:""}),null);
  }
  if(rule.accident)assert.match(validateRecoveryDetails({...input,accident:""}),/accident/);
  assert.equal(validateRecoveryDetails({...input,make:"",model:"",email:"",problemDescription:""}),null);
 });
}
test("breakdown roadside has no transport destination or loading questions",()=>{
 const input={...valid,recoveryType:"Breakdown Recovery",destinationMode:"Roadside Assistance Without Transport",destinationPostcode:"",runningStatus:"",rollingStatus:"",passengerCount:""};
 assert.equal(validateRecoveryDetails(input),null);
 assert.match(validateRecoveryDetails({...input,destinationMode:""}),/roadside assistance or vehicle transport/);
 assert.match(validateRecoveryDetails({...input,destinationMode:"transport"}),/destination postcode/);
});
test("scheduled requires future time; optional email is validated when supplied",()=>{
 assert.match(validateRecoveryDetails({...valid,timing:"Scheduled",preferredCollectionTime:"2020-01-01T00:00"}),/future scheduled/);
 assert.equal(validateRecoveryDetails({...valid,timing:"Scheduled",preferredCollectionTime:"2099-01-01T10:00",email:""}),null);
 assert.match(validateRecoveryDetails({...valid,email:"invalid"}),/email address/);
});
test("read-only bookings are protected on the server, not only by disabled UI",async()=>{
 const {readFileSync}=await import("node:fs");
 const source=readFileSync("app/api/recovery/jobs/route.ts","utf8");
 assert.match(source,/if\(isClientReviewDemo\(\)\|\|process\.env\.VERCEL_ENV==="production"\)return bad/);
});
