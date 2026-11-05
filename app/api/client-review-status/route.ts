import {customerMilestoneProductionEnabled} from "@/src/lib/customer-production-gate";
import {NextResponse} from "next/server";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
export const dynamic="force-dynamic";
export function GET(){
 const isolatedStaging=isIsolatedMarketplaceStaging();
 return NextResponse.json({clientDemo:!isolatedStaging&&!customerMilestoneProductionEnabled(),writesEnabled:isolatedStaging||customerMilestoneProductionEnabled(),customerProductionEnabled:customerMilestoneProductionEnabled(),pricingApproved:false,isolatedStaging},
 {headers:{"Cache-Control":"no-store"}});
}