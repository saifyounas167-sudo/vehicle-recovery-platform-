import {calculateEstimate} from "./pricing";
export const pricingKeys=["minimumCallout","pricePerMile","vehicleSurcharge","nonRunningSurcharge","lockedWheelSurcharge","accidentSurcharge","nightSurcharge","weekendSurcharge","bankHolidaySurcharge","urgentSurcharge","loadingDifficultySurcharge","specialEquipmentSurcharge"] as const;
export type PricingKey=typeof pricingKeys[number];
export type PricingConfig=Record<PricingKey,number>;
export function validPricingConfig(value:unknown):value is PricingConfig{
 if(!value||typeof value!=="object")return false;
 const obj=value as Record<string,unknown>;
 return pricingKeys.every(key=>typeof obj[key]==="number"&&Number.isFinite(obj[key])&&(obj[key] as number)>=0&&(obj[key] as number)<=100000);
}
export function holidayRegion(postcode:string):"england-and-wales"|"scotland"|"northern-ireland"{
 const p=postcode.trim().toUpperCase();
 if(/^BT/.test(p))return "northern-ireland";
 if(/^(AB|DD|DG|EH|FK|G\d|HS|IV|KA|KW|KY|ML|PA|PH|ZE)/.test(p))return "scotland";
 return "england-and-wales";
}
export async function ukHoliday(date:string,postcode:string):Promise<boolean>{
 const response=await fetch("https://www.gov.uk/bank-holidays.json",{next:{revalidate:86400},signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw Error("UK holiday calendar unavailable");
 const calendar=await response.json();const entries=calendar[holidayRegion(postcode)]?.events;
 if(!Array.isArray(entries))throw Error("Missing holiday region");
 return entries.some((e:{date?:string})=>e.date===date);
}
export function calculateRecoveryPrice(config:PricingConfig,miles:number,flags:{vehicleType:string;nonRunning:boolean;lockedWheels:boolean;accident:boolean;urgent:boolean;night:boolean;weekend:boolean;bankHoliday:boolean;loadingDifficulty:boolean;specialEquipment:boolean}){
 if(!Number.isFinite(miles)||miles<=0)throw Error("Verified road distance required");
 const extras=(flags.vehicleType.toLowerCase()==="van"?config.vehicleSurcharge:0)+(flags.nonRunning?config.nonRunningSurcharge:0)+(flags.lockedWheels?config.lockedWheelSurcharge:0)+(flags.accident?config.accidentSurcharge:0)+(flags.urgent?config.urgentSurcharge:0)+(flags.night?config.nightSurcharge:0)+(flags.weekend?config.weekendSurcharge:0)+(flags.bankHoliday?config.bankHolidaySurcharge:0)+(flags.loadingDifficulty?config.loadingDifficultySurcharge:0)+(flags.specialEquipment?config.specialEquipmentSurcharge:0);
 return calculateEstimate({baseFee:config.minimumCallout,distanceMiles:miles,distanceRate:config.pricePerMile,equipmentFee:extras});
}
