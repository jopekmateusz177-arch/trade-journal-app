"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlanLabel, type SubscriptionPlan } from "../../../lib/billing/plans";

type SettingsClientProps = {
  userEmail: string;
  userId: string;
  subscriptionSummary: {
    plan: SubscriptionPlan;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    hasActiveAccess: boolean;
  };
};

type LocalSettings = {
  displayName: string;
  timezone: string;
  tradingSession: string;
  riskPerTrade: string;
  currency: string;
};

type OnboardingItem = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};

const SETTINGS_STORAGE_KEY = "trade-journal-settings";
const ONBOARDING_STORAGE_KEY = "trade-journal-onboarding";

const defaultSettings: LocalSettings = {
  displayName: "",
  timezone: "America/Chicago",
  tradingSession: "US Equities",
  riskPerTrade: "100",
  currency: "USD",
};

const defaultOnboarding: OnboardingItem[] = [
  {
    id: "first_trade",
    label: "Log your first trade",
    description: "Start capturing real execution data.",
    completed: false,
  },
  {
    id: "first_review",
    label: "Complete a trade review",
    description: "Rate adherence, confidence, emotion, and lesson learned.",
    completed: false,
  },
  {
    id: "saved_view",
    label: "Save a custom view",
    description: "Create a reusable workflow for your journal.",
    completed: false,
  },
  {
    id: "weekly_review",
    label: "Run a weekly review",
    description: "Use the review center to inspect one full trading week.",
    completed: false,
  },
];

export function SettingsClient({
  userEmail,
  userId,
  subscriptionSummary,
}: SettingsClientProps) {
  const [settings, setSettings] = useState<LocalSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) return defaultSettings;

    try {
      return { ...defaultSettings, ...JSON.parse(storedSettings) };
    } catch {
      return defaultSettings;
    }
  });

  const [onboarding, setOnboarding] = useState<OnboardingItem[]>(() => {
    if (typeof window === "undefined") return defaultOnboarding;
    const storedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (!storedOnboarding) return defaultOnboarding;

    try {
      return JSON.parse(storedOnboarding) as OnboardingItem[];
    } catch {
      return defaultOnboarding;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboarding));
  }, [onboarding]);

  const onboardingProgress = useMemo(() => {
    const completed = onboarding.filter((item) => item.completed).length;
    return onboarding.length ? (completed / onboarding.length) * 100 : 0;
  }, [onboarding]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Account and product settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#94a3b8]">
          Keep the same trading-journal experience, but give it the SaaS structure
          it needs: personal preferences, billing direction, onboarding, and a
          clear database migration path for review intelligence.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Account
          </h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Email
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {userEmail || "No email available"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                User ID
              </p>
              <p className="mt-2 break-all text-sm text-[#cbd5e1]">{userId}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Billing Status
          </h2>
          <div className="mt-5 rounded-2xl border border-[#2962ff]/20 bg-[#0b1220] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              {getPlanLabel(subscriptionSummary.plan)} Plan
            </p>
            <p className="mt-2 text-sm leading-6 text-[#dbe4ff]">
              Billing is currently{" "}
              <span className="font-semibold capitalize">
                {subscriptionSummary.status}
              </span>
              .{" "}
              {subscriptionSummary.currentPeriodEnd
                ? `Current access is tracked through ${new Date(
                    subscriptionSummary.currentPeriodEnd
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}.`
                : "No paid subscription is active yet, so the account remains on Starter access."}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1220] p-4 text-sm text-[#94a3b8]">
            {subscriptionSummary.cancelAtPeriodEnd
              ? "This subscription is set to cancel at the end of the current billing period."
              : "Webhook-driven subscription syncing is ready once the Stripe and Supabase environment variables are live."}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Profile Preferences
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Display Name
              </label>
              <input
                value={settings.displayName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, displayName: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
                placeholder="Your trader profile name"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
              >
                {["America/Chicago", "America/New_York", "America/Los_Angeles", "Europe/London"].map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Trading Session
              </label>
              <select
                value={settings.tradingSession}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, tradingSession: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
              >
                {["US Equities", "Futures", "Options", "Crypto", "Forex"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Default Risk Per Trade
              </label>
              <input
                value={settings.riskPerTrade}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, riskPerTrade: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
                placeholder="100"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
              >
                {["USD", "EUR", "GBP", "CAD"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Billing Direction
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              {
                name: "Starter",
                price: "$0",
                detail: "Core journal, basic analytics, and saved views",
              },
              {
                name: "Pro",
                price: "$19/mo",
                detail: "Advanced review analytics, reports, and psychology tools",
              },
              {
                name: "Elite",
                price: "$49/mo",
                detail: "Team coaching, exports, weekly AI review, and premium workflows",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-4 ${
                  getPlanLabel(subscriptionSummary.plan) === plan.name
                    ? "border-[#2962ff]/40 bg-[#101a2f]"
                    : "border-white/10 bg-[#0b1220]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-sm text-[#94a3b8]">{plan.detail}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#dbe4ff]">{plan.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Onboarding Checklist
            </h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Shape the first-run experience so new users understand the value fast.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-[#dbe4ff]">
            {onboardingProgress.toFixed(0)}% complete
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {onboarding.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b1220] p-4"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) =>
                  setOnboarding((prev) =>
                    prev.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, completed: e.target.checked }
                        : entry
                    )
                  )
                }
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-sm text-[#94a3b8]">{item.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
