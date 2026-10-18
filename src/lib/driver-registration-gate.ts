import {isIsolatedMarketplaceStaging} from "./marketplace-staging";
/** Independent account-onboarding gate. Does not enable recovery jobs, offers or billing. */
export function isDriverRegistrationEnabled(){
 if(isIsolatedMarketplaceStaging())return true;
 if(process.env.VERCEL_ENV!=="production")return false;
 return process.env.ENABLE_DRIVER_REGISTRATION_PRODUCTION==="enabled"
   && process.env.DRIVER_REGISTRATION_PRODUCTION_APPROVED==="approved"
   && process.env.NEXT_PUBLIC_SUPABASE_URL==="https://eosprarfgrydnykekcn.supabase.co"
   && Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}