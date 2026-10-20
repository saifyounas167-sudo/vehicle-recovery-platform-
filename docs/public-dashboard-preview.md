# Public dashboard preview — client design review

This feature intentionally serves **synthetic, non-authenticated sample UI** at `/preview/customer`, `/preview/driver`, and `/preview/admin`, including on Production once PR #64 is reviewed and merged/deployed. No environment configuration or new Supabase project is needed.

The normal website header shows a clearly labelled **Preview Mode** link, including the mobile menu. All original login links remain unchanged. Public previews import no Supabase client, fetch no private APIs, and provide no real marketplace actions. They are not substitutes for authenticated dashboard QA. They include a visible sample-data warning and `noindex` metadata.

**To turn off all previews:** change `DASHBOARD_PREVIEW_PUBLIC_ENABLED` to `false` in `src/lib/dashboard-preview.ts`, commit and deploy. Both public preview routes and header links disappear (404). Alternatively set `DASHBOARD_PREVIEW_MODE=disabled` in the relevant deployment environment; this optional flag is used by CI. Do not change any auth middleware or RLS policy.

**Release sequence:** review PR #62 and #63 and complete their authenticated Staging QA (or retain their backend actions disabled). Review PR #64 independently. Merge #62, then #63, then #64 only after a combined build/regression pass; no automatic deployment. PR #56 is separate. Production marketplace writes, payments, offers, bookings and notifications remain disabled.

**Security reminder:** Public synthetic previews are intentionally accessible to everyone. Never import live customer, driver or admin components into preview routes unless those components are audited to be entirely free of private data fetching and actions.
