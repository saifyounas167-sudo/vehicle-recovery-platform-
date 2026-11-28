export const PRODUCTION_ADMIN_EMAIL = "saifyounas112@gmail.com";
export const PRODUCTION_SUPABASE_URL =
  "https://eosrparfgrycdnykekcn.supabase.co";

type AuthIdentity = {
  email?: string | null;
  email_confirmed_at?: string | null;
} | null | undefined;

/**
 * This gate is intentionally Production-only and disabled by default.
 * The database RPC repeats the account and one-time checks independently.
 */
export function isProductionAdminActivationEnabled(): boolean {
  return (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_GIT_COMMIT_REF === "main" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === PRODUCTION_SUPABASE_URL &&
    process.env.PRODUCTION_ADMIN_ACTIVATION_ENABLED === "enabled"
  );
}

export function isPinnedProductionAdmin(user: AuthIdentity): boolean {
  return (
    Boolean(user) &&
    user?.email?.trim().toLowerCase() === PRODUCTION_ADMIN_EMAIL &&
    Boolean(user?.email_confirmed_at)
  );
}
