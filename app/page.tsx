import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

const pillars = [
  {
    label: "Fast Entry",
    title: "Log trades in seconds",
    description:
      "Capture date, ticker, side, entry, exit, size, screenshots, and notes without adding friction to your process.",
  },
  {
    label: "Behavior Review",
    title: "See how you actually trade",
    description:
      "Track mistakes, emotions, and adherence so the journal explains why your P&L moves, not just what happened.",
  },
  {
    label: "Premium Insight",
    title: "Upgrade only when deeper insight matters",
    description:
      "Keep the free journal useful. Unlock advanced analytics, weekly summaries, and behavior signals when you are ready.",
  },
];

const questions = [
  {
    question: "How am I performing right now?",
    answer: "Dashboard surfaces P&L, win rate, and the stats that matter first.",
  },
  {
    question: "Which setups actually make me money?",
    answer: "Setup analytics tie patterns directly to total and average P&L.",
  },
  {
    question: "What mistakes keep costing me?",
    answer: "Mistake tracking highlights recurring leaks and their performance impact.",
  },
  {
    question: "Am I improving week to week?",
    answer: "Review workflows and weekly summaries keep progress visible.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Useful core journaling for disciplined traders.",
    features: ["Fast trade logging", "Trade table and filters", "Core P&L and win rate"],
  },
  {
    name: "Pro",
    price: "$19/mo",
    description: "For traders who want stronger review loops and edge tracking.",
    features: [
      "Advanced analytics",
      "Setup and mistake insight",
      "Weekly review summaries",
    ],
    featured: true,
  },
  {
    name: "Elite",
    price: "$49/mo",
    description: "For serious traders building a deeper performance process.",
    features: ["Everything in Pro", "Premium review workflows", "Higher-touch reporting direction"],
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#08111f] text-[#e5e7eb]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(41,98,255,0.18),transparent_55%),linear-gradient(180deg,rgba(15,23,40,0.95),rgba(8,17,31,1))]" />

      <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-5 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
            TradeEdge
          </p>
          <p className="mt-2 text-sm text-[#94a3b8]">
            Behavior-first journaling for active traders
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/40 hover:bg-[#101a2f]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-2xl bg-[#2962ff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3b73ff]"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 pb-10 md:px-8">
        <section className="grid gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#0f1728]/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
                Clean. Fast. Insight-Driven.
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                A trading journal built to improve behavior, not just store trades.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[#94a3b8] md:text-base">
                Log trades quickly, review your decisions clearly, and connect
                your mistakes, emotions, and setups directly to profitability.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-2xl bg-[#2962ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff]"
              >
                Start Journaling
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-3 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/40 hover:bg-[#101a2f]"
              >
                See Paid Insights
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Focus", "Fast execution review"],
                ["Core Stats", "P&L, win rate, drawdown"],
                ["Retention", "Weekly review workflows"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-[#131c31] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#0b1220] p-5">
            <div className="rounded-3xl border border-white/10 bg-[#101a2f] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Why Traders Stay
              </p>
              <div className="mt-4 grid gap-3">
                {questions.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-white">{item.question}</p>
                    <p className="mt-1 text-sm leading-6 text-[#94a3b8]">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                  Trade Table
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Sortable</p>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  Clear history with fast edits and saved views.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                  Review
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Behavior-first</p>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  Mistakes, emotions, confidence, and lessons learned.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#131c31] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                  Premium
                </p>
                <p className="mt-2 text-lg font-semibold text-white">Insight gating</p>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  Advanced analytics unlock when users need more depth.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[28px] border border-white/10 bg-[#131c31] p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                {pillar.label}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                {pillar.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#94a3b8]">
                {pillar.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#131c31] p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
              Product Direction
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Built for traders who want cleaner decisions, not more noise.
            </h2>
            <div className="mt-6 grid gap-4">
              {[
                "Fast trade entry stays front and center",
                "Core stats remain visible and easy to scan",
                "Mistake and emotion analysis stay tied to P&L",
                "Paid tiers focus on deeper insight, not clutter",
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-[#dbe4ff]"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#131c31] p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
              Pricing Snapshot
            </p>
            <div className="mt-5 grid gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-3xl border p-5 ${
                    plan.featured
                      ? "border-[#2962ff]/40 bg-[#101a2f]"
                      : "border-white/10 bg-[#0b1220]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                        {plan.name}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-white">{plan.price}</p>
                    </div>
                    {plan.featured ? (
                      <span className="rounded-full border border-[#2962ff]/25 bg-[#2962ff]/10 px-3 py-1 text-xs font-semibold text-[#dbe4ff]">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#94a3b8]">
                    {plan.description}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl border border-white/10 bg-[#131c31] px-4 py-3 text-sm text-[#dbe4ff]"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0f1728] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
                Get Started
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Build a review process you&apos;ll actually use every week.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#94a3b8]">
                Start with the free journal. Upgrade when you want advanced
                analytics, stronger review loops, and a clearer read on behavior.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-2xl bg-[#2962ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff]"
              >
                Create Account
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-3 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/40 hover:bg-[#101a2f]"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
