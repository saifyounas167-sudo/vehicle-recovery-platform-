/** Shared service-specific contract. Labels are existing persisted service identifiers. */
export const recoveryServices=["Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing","Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery","Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"] as const;
export type RecoveryService=typeof recoveryServices[number];
export type ServiceRules={destination:"required"|"none"|"choice";condition:boolean;rolling:boolean;accident:boolean;passengers:boolean};
const rules:Record<RecoveryService,ServiceRules>={
"Breakdown Recovery":{destination:"choice",condition:true,rolling:true,accident:false,passengers:true},
"Accident Recovery":{destination:"required",condition:true,rolling:true,accident:true,passengers:true},
"Vehicle Transport":{destination:"required",condition:true,rolling:true,accident:false,passengers:true},
"Car Towing":{destination:"required",condition:true,rolling:true,accident:false,passengers:true},
"Jump Start / Flat Battery Assistance":{destination:"none",condition:false,rolling:false,accident:false,passengers:false},
"Flat Tyre Assistance":{destination:"none",condition:false,rolling:false,accident:false,passengers:false},
"Motorbike Recovery":{destination:"required",condition:true,rolling:true,accident:false,passengers:false},
"Van Recovery":{destination:"required",condition:true,rolling:true,accident:false,passengers:true},
"Auction Vehicle Collection":{destination:"required",condition:true,rolling:true,accident:false,passengers:false},
"Non-Running Vehicle Transport":{destination:"required",condition:true,rolling:true,accident:false,passengers:true}
};
export const isRecoveryService=(v:unknown):v is RecoveryService=>typeof v==="string"&&(recoveryServices as readonly string[]).includes(v);
export const getServiceRules=(v:unknown)=>isRecoveryService(v)?rules[v]:null;
export const requiresDestination=(service:unknown,mode:string)=>{const r=getServiceRules(service);return !!r&&(r.destination==="required"||(r.destination==="choice"&&mode==="transport"));};
const value=(v:unknown)=>typeof v==="string"?v.trim():"";
export function validateRecoveryDetails(input:Record<string,unknown>):string|null{
 const service=value(input.recoveryType),rule=getServiceRules(service);
 if(!rule)return "Choose a recovery service.";
 if(!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(value(input.pickupPostcode)))return "Enter a valid UK pickup postcode.";
 if(!value(input.pickupAddress))return "Confirm the pickup street/address or nearest landmark.";
 if(rule.destination==="choice"&&!["transport","Roadside Assistance Without Transport"].includes(value(input.destinationMode)))return "Choose roadside assistance or vehicle transport.";
 if(requiresDestination(service,value(input.destinationMode))&&!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(value(input.destinationPostcode)))return "Enter a valid UK destination postcode.";
 if(value(input.destinationPostcode)&&!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(value(input.destinationPostcode)))return "Enter a valid UK destination postcode.";
 if(!["Car","Van","Motorbike","4x4","Other"].includes(value(input.vehicleType)))return "Select your vehicle type.";
 const loading=rule.destination==="choice"?value(input.destinationMode)==="transport":rule.destination==="required";
 if(loading&&rule.condition&&!["Running","Non-running"].includes(value(input.runningStatus)))return "Confirm whether the vehicle is running.";
 if(loading&&rule.rolling&&!["Yes","No","Not Sure","Not sure"].includes(value(input.rollingStatus)))return "Confirm whether the vehicle can roll for loading.";
 if(rule.accident&&!["Yes","No"].includes(value(input.accident)))return "Confirm the accident condition.";
 if(loading&&rule.passengers&&!/^[0-8]$/.test(value(input.passengerCount)))return "Select the passenger count (0–8).";
 if(value(input.timing)==="Scheduled"&&(!value(input.preferredCollectionTime)||!Number.isFinite(Date.parse(value(input.preferredCollectionTime)))||Date.parse(value(input.preferredCollectionTime))<=Date.now()))return "Choose a future scheduled date and time.";
 if(!["urgent","Scheduled"].includes(value(input.timing)))return "Choose ASAP or Scheduled.";
 if(!value(input.customerName))return "Enter your full name.";
 if(!/^(?:\+447\d{9}|07\d{9})$/.test(value(input.phone).replace(/[\s-]/g,"")))return "Enter a valid UK mobile number.";
 if(value(input.email)&&!/^\S+@\S+\.\S+$/.test(value(input.email)))return "Enter a valid email address or leave it blank.";
 return null;
}
