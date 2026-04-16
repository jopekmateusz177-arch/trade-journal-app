import { createCheckoutSession } from "../../actions/checkout";
import { createClient } from "../../../lib/supabase/server";
import {
  getUserSubscription,
  summarizeSubscription,
} from "../../../lib/billing/subscriptions";
import { getPlanLabel } from "../../../lib/billing/plans";

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For traders building journaling discipline.",
    features: [
      "Trade journal and history",
      "Core analytics and review center",
      "Saved views and filters",
    ],
    cta: "Current Foundation",
    interactive: false,
  },
  {
    name: "Pro",
    price: "$19/mo",
    description: "For traders who want better review loops and edge tracking.",
    features: [
      "Advanced review analytics",
      "Weekly performance summaries",
      "Premium workflow presets",
      "Deeper psychology insights",
    ],
    cta: "Upgrade to Pro",
    plan: "pro" as const,
    interactive: true,
  },
  {
    name: "Elite",
    price: "$49/mo",
    description: "For serious traders and coaching-led workflows.",
    features: [
      "Everything in Pro",
      "Coach or mentor overlays",
      "Priority exports and reporting",
      "AI-assisted weekly reviews",
    ],
    cta: "Upgrade to Elite",
    plan: "elite" as const,
    interactive: true,
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const subscription = user ? await getUserSubscription(supabase, user.id) : null;
  const summary = summarizeSubscription(subscription);

  const statusMessage =
    status === "success"
      ? "Checkout completed. Your billing access will sync as soon as the Stripe webhook confirms the subscription."
      : status === "cancelled"
      ? "Checkout was cancelled. Your plan has not changed."
      : status === "missing_price"
      ? "Stripe price IDs are not configured yet. Add STRIPE_PRICE_PRO and STRIPE_PRICE_ELITE to enable checkout."
      : status === "error"
      ? "Unable to create a checkout session."
      : "";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
          Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Subscription plans for Trade Journal
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#94a3b8]">
          Keep the upgrade path tight and insight-driven. Core journaling stays
          lean, while paid tiers unlock deeper review loops, stronger behavior
          analytics, and the retention features serious traders will actually use.
        </p>
      </section>

      {statusMessage ? (
        <section className="rounded-3xl border border-white/10 bg-[#131c31] px-5 py-4 text-sm text-[#dbe4ff]">
          {statusMessage}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 ${
              plan.name === "Pro"
                ? "border-[#2962ff]/40 bg-[#13203a]"
                : "border-white/10 bg-[#131c31]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                  {plan.name}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {plan.price}
                </h2>
              </div>
              {plan.name === "Pro" ? (
                <span className="rounded-full border border-[#2962ff]/30 bg-[#2962ff]/12 px-3 py-1 text-xs font-semibold text-[#dbe4ff]">
                  Recommended
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-[#94a3b8]">
              {plan.description}
            </p>

            <div className="mt-6 grid gap-3">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-[#dbe4ff]"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-6">
              {plan.interactive && plan.plan ? (
                <form action={createCheckoutSession.bind(null, plan.plan)}>
                  <button className="w-full rounded-2xl bg-[#2962ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff]">
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <button
                  disabled
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-semibold text-[#94a3b8]"
                >
                  {plan.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Current Billing Status
          </h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Current Plan
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {getPlanLabel(summary.plan)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Subscription Status
              </p>
              <p className="mt-2 text-sm font-medium capitalize text-[#dbe4ff]">
                {summary.status}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-[#94a3b8]">
              {summary.currentPeriodEnd
                ? `Current access period ends on ${new Date(summary.currentPeriodEnd).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}.`
                : "No paid subscription is active yet. Starter remains available while billing is inactive."}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Stripe Setup Checklist
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              "Add STRIPE_SECRET_KEY",
              "Add STRIPE_WEBHOOK_SECRET",
              "Add STRIPE_PRICE_PRO",
              "Add STRIPE_PRICE_ELITE",
              "Add SUPABASE_SERVICE_ROLE_KEY",
              "Set NEXT_PUBLIC_APP_URL to your production domain",
              "Point Stripe webhooks to /api/stripe/webhook",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-[#dbe4ff]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Monetization Strategy
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              "Keep Starter useful enough to spread organically",
              "Make Pro the default serious trader plan",
              "Use Elite for power users, coaching, and advanced reporting",
              "Anchor upgrades around review quality, not just more charts",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-[#dbe4ff]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
