import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export function GET(){
 return NextResponse.json({clientDemo:true,writesEnabled:false,pricingApproved:false},
 {headers:{"Cache-Control":"no-store"}});
}
