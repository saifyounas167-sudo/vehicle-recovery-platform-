# PWA / Install App architecture

PWA is a mandatory core requirement for both customer and driver experiences.

- Web App Manifest and standalone mode
- Service worker registration and app-shell fallback
- Installable icon assets
- Apple web-app metadata
- Mobile-first viewport
- Service-worker boundary reserved for future Web Push

Customer and driver routes share one installable web application; role-specific experiences are surfaced by authentication and authorisation later.

The backend/domain contracts remain provider-neutral so future native Android/iOS apps can consume the same APIs without depending on Next.js page components.

Push provider, VAPID configuration and permission UX remain unconfirmed and are intentionally not hard-coded.