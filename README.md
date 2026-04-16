# Trade Journal

Trade Journal is a full-stack trading journal built with Next.js, Supabase, Stripe, and Vercel.

The product is centered on three ideas:

- fast trade entry
- behavior-driven review
- premium analytics that connect directly to profitability

## Current Product Shape

The app includes:

- public landing page
- email/password auth with Supabase
- protected workspace
- trade logging, editing, deleting, filtering, sorting
- screenshot upload to Supabase Storage
- review workflow with adherence, confidence, emotion, and lesson learned
- dashboard, trades, analytics, setups, mistakes, review, pricing, and settings pages
- Stripe checkout scaffolding
- Stripe webhook subscription syncing
- plan-aware gating for premium insight features

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase Database
- Supabase Storage
- Stripe
- Vercel

## Local Development

1. Install dependencies

```bash
npm install
```

2. Copy the environment template

```bash
cp .env.example .env.local
```

3. Fill in the required values in `.env.local`

4. Start the dev server

```bash
npm run dev
```

## Required Environment Variables

For auth and data:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ELITE`

For app URLs:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`

## Supabase Migrations To Apply

Run these migrations in order:

1. `supabase/migrations/20260408_add_trade_review_fields.sql`
2. `supabase/migrations/20260409_add_subscriptions.sql`

## Stripe Webhook

Point Stripe to:

```text
https://your-live-domain.com/api/stripe/webhook
```

Relevant events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Launch Checklist

Before going live:

1. Apply both Supabase migrations
2. Add all required Vercel environment variables
3. Confirm Stripe price IDs are correct
4. Set Stripe webhook URL and secret
5. Test sign up, sign in, trade save, trade edit, screenshot upload, and pricing flow
6. Deploy the latest code to Vercel

## Main Routes

- `/`
- `/login`
- `/dashboard`
- `/trades`
- `/analytics`
- `/review`
- `/setups`
- `/mistakes`
- `/pricing`
- `/settings`

## Product Direction

Trade Journal is being built as a clean, insight-driven journaling product for traders.

Current priorities:

- extremely fast entry flow
- stronger trade table clarity
- visible core stats
- behavior analytics tied to P&L
- review and weekly summary workflows
- clear free vs paid feature boundaries
