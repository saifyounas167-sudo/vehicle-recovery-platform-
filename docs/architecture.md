# Architecture foundation

## Layers

- app/: routes and UI
- src/components/: reusable UI components
- src/lib/: server-side integrations and business services
- src/types/: shared domain types
- docs/: architecture and product decisions

## Planned domains

- Customer recovery requests
- Driver onboarding and approval
- Job marketplace
- Configurable pricing
- Subscriptions and payments
- Notifications
- Administration
- Audit/security

## Data principle

The database model should support future requirements without forcing unconfirmed workflows. Pricing rules, driver access rules and marketplace offer/accept behaviour remain configurable until confirmed.

## Security principle

Secrets belong in environment variables. Customer contact information should only be returned by authorised server-side workflows. Public/client components must never receive secret provider credentials.