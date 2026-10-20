/** Public design previews: isolated static sample UI only.
 * Deliberately enabled during client review, including Production.
 * Set this code flag to false to retire all public previews without touching
 * Supabase, auth, Vercel secrets, or real dashboard routes.
 * An optional DASHBOARD_PREVIEW_MODE=disabled environment value also shuts
 * them off (used by ON/OFF CI). No environment changes are needed to enable.
 */
export const DASHBOARD_PREVIEW_PUBLIC_ENABLED = true;
export function isDashboardPreviewEnabled(): boolean {
  return DASHBOARD_PREVIEW_PUBLIC_ENABLED && process.env.DASHBOARD_PREVIEW_MODE !== "disabled";
}
