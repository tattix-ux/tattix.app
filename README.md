# TatBot

TatBot is a mobile-first link-in-bio lead funnel and tattoo price estimation app for tattoo artists.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style reusable components
- Supabase for auth, database, and storage
- React Hook Form + Zod
- Zustand for funnel state
- Framer Motion for transitions

## Product Areas

- Landing page at `/`
- Auth at `/signup`, `/login`, `/reset-password`, and `/update-password`
- Protected dashboard at `/dashboard/*`
- Page customization editor at `/dashboard/customize`
- Public artist pages at `/:slug`
- Seeded demo route at `/ink-atelier-demo`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Add your Supabase values to `.env.local`.

4. Apply the schema in [supabase/migrations/20260409150000_tatbot_schema.sql](/Users/MonsterPC/Documents/tatbot/supabase/migrations/20260409150000_tatbot_schema.sql), then seed with [supabase/seed.sql](/Users/MonsterPC/Documents/tatbot/supabase/seed.sql).

5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

## Demo Behavior

- Without Supabase env vars, TatBot still renders the seeded demo artist and a dashboard preview in demo mode.
- The public demo artist route is `/ink-atelier-demo`.
- The customization editor includes a live preview with mobile and desktop toggles.
- Auth, storage, and persistence become live when Supabase is configured.

## Folder Structure

```text
app/
  api/                    Route handlers for public submissions and dashboard updates
  auth/callback/          Supabase auth callback
  dashboard/              Protected artist dashboard routes
  [slug]/                 Public artist page
components/
  auth/                   Auth forms
  dashboard/              Dashboard UI and forms
  funnel/                 Public intake flow
  shared/                 Shared shells and branding
  ui/                     Reusable shadcn/ui-style primitives
lib/
  config/                 Site config
  constants/              Body placements and option catalogs
  data/                   Demo fallback and Supabase data access
  forms/                  Zod schemas
  pricing/                Rule-based estimator
  supabase/               Server, browser, and storage helpers
store/
  funnel-store.ts         Zustand state for the public flow
supabase/
  migrations/             Schema and RLS SQL
  seed.sql                Demo artist seed data
```

## Verification

Run these checks locally:

```bash
npm run lint
npm run typecheck
npm run build
```
