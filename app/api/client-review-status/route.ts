import {NextResponse} from "next/server";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
export async function GET(){
 const registrationEnabled=await isDriverRegistrationEnabled();
 return NextResponse.json({clientDemo:true,writesEnabled:false,pricingApproved:false,isolatedStaging:false,driverRegistrationEnabled:registrationEnabled},
 {headers:{"Cache-Control":"no-store"}});
}
