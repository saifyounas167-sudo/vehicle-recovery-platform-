import {NextResponse} from "next/server";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
export function GET(){return NextResponse.json(
 {registrationEnabled:isDriverRegistrationEnabled()},
 {headers:{"Cache-Control":"no-store"}})}
