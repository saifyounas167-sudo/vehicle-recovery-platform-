import {NextResponse} from "next/server";
import {googleOAuthEnabled} from "@/src/lib/google-oauth-gate";
export const dynamic="force-dynamic";
export function GET(){return NextResponse.json({enabled:googleOAuthEnabled()},{headers:{"Cache-Control":"no-store"}})}
