import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
export function googleOAuthEnabled(){
 // Never allow Google OAuth in Production or ordinary preview.
 return isIsolatedMarketplaceStaging() && process.env.ENABLE_GOOGLE_OAUTH_STAGING==="enabled";
}
export type LoginRole="driver"|"customer"|"admin";
export function validLoginRole(role:string|null):LoginRole|null{
 return role==="driver"||role==="customer"||role==="admin"?role:null;
}
export function roleDestination(role:LoginRole){return "/"+role}
