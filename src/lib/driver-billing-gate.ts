/** Stripe billing is sandbox-only; there is intentionally NO Production enable flag.
 * Marketplace client-review protections are independent and remain unchanged.
 * Do not reuse the OAuth gate or accept values from a browser request.
 */
export function isStripeBillingSandboxEnabled():boolean{
 if(process.env.VERCEL_ENV!=="preview")return false;
 if(process.env.VERCEL_GIT_COMMIT_REF!=="feature/ss9-driver-subscription-stripe-foundation")return false;
 if(process.env.ENABLE_STRIPE_TEST_BILLING!=="enabled")return false;
 const expected="https://ozphvosiqbzvkthlppkd.supabase.co";
 if(process.env.NEXT_PUBLIC_SUPABASE_URL!==expected||process.env.STAGING_SUPABASE_URL!==expected)return false;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||key!==process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY||key===process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY)return false;
 return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")&&process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"));
}
