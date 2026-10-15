import {NextResponse} from "next/server";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
export const dynamic="force-dynamic";
export function GET(){
 const isolatedStaging=isIsolatedMarketplaceStaging();
 return NextResponse.json({clientDemo:!isolatedStaging,writesEnabled:isolatedStaging,pricingApproved:false,isolatedStaging},
 {headers:{"Cache-Control":"no-store"}});
}