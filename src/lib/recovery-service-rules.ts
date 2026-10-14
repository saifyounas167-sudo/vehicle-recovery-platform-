/** One shared contract for the ten approved recovery services. No guessed surcharge values. */
export const recoveryServices = [
"Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing",
"Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery",
"Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"] as const;
export type RecoveryService = typeof recoveryServices[number];
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
export const isRecoveryService=(x:unknown):x is RecoveryService=>typeof x==="string"&&(recoveryServices as readonly string[]).includes(x);
export const getServiceRules=(x:unknown):ServiceRules|null=>isRecoveryService(x)?rules[x]:null;
export function requiresDestination(service:unknown,mode:string){const rule=getServiceRules(service);return !!rule&&(rule.destination==="required"||(rule.destination==="choice"&&mode==="transport"));}
export function validateRecoveryDetails(input:Record<string,unknown>):string|null{
 const text=(x:unknown)=>typeof x==="string"?x.trim():"";
 const service=text(input.recoveryType),rule=getServiceRules(service);
 if(!rule)return "Choose a recovery service.";
 if(!text(input.vehicleType))return "Select your vehicle type.";
 if(rule.destination==="choice"&&!["transport","Roadside Assistance Without Transport"].includes(text(input.destinationMode)))return "Choose roadside assistance or vehicle transport.";
 if(rule.condition&&!["Running","Non-running"].includes(text(input.runningStatus)))return "Confirm whether the vehicle is running.";
 if(rule.rolling&&!["Yes","No","Not Sure","Not sure"].includes(text(input.rollingStatus)))return "Confirm whether the vehicle can roll for loading.";
 if(rule.accident&&!["Yes","No"].includes(text(input.accident)))return "Confirm the accident condition.";
 if(rule.passengers&&(!/^[0-8]$/.test(text(input.passengerCount))))return "Select the passenger count (0–8).";
 if(text(input.timing)==="Scheduled"&&(!text(input.preferredCollectionTime)||!Number.isFinite(Date.parse(text(input.preferredCollectionTime)))||Date.parse(text(input.preferredCollectionTime))<Date.now()))return "Choose a future scheduled date and time.";
 return null;
}
