/** Public, synthetic dashboard previews. Both explicit flags are required.
 * Vercel Production is never eligible, even if a flag is accidentally set.
 * No authentication/session/database/service-role calls are allowed in previews.
 */
export function isDashboardPreviewEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") return false;
  return process.env.DASHBOARD_PREVIEW_MODE === "enabled"
    && process.env.NEXT_PUBLIC_DASHBOARD_PREVIEW_MODE === "enabled";
}
