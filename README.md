# UK Vehicle Recovery Marketplace

A mobile-first UK vehicle recovery and transport marketplace built with Next.js and TypeScript.

## Current foundation

- Next.js 16.3.8
- TypeScript
- App Router
- Vercel-ready project structure
- Customer recovery request foundation
- Driver area foundation
- Admin area foundation
- Environment variable template
- Architecture prepared for PostgreSQL/Supabase, maps/routes, vehicle data, Stripe and notifications

## Important

This repository does not copy the Make Me Busy website. That site is used only as a functional/business-flow reference.

Unconfirmed client requirements are intentionally left configurable and are not hard-coded.

## Local setup

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build:

```bash
npm run typecheck
npm run build
npm start
```

Copy `.env.example` to `.env.local` and add real credentials only locally or through Vercel environment variables. Never commit secrets.