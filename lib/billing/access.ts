import type { SubscriptionPlan } from "./plans";

export type BillingFeature =
  | "advancedAnalytics"
  | "setupAnalytics"
  | "mistakeAnalytics"
  | "reviewInsights";

type FeatureConfig = {
  requiredPlan: SubscriptionPlan;
  label: string;
  description: string;
};

const FEATURE_CONFIG: Record<BillingFeature, FeatureConfig> = {
  advancedAnalytics: {
    requiredPlan: "pro",
    label: "Advanced Analytics",
    description: "Profit factor, expectancy, drawdown, and the performance curve.",
  },
  setupAnalytics: {
    requiredPlan: "pro",
    label: "Setup Analytics",
    description: "See which setups consistently drive profitability.",
  },
  mistakeAnalytics: {
    requiredPlan: "pro",
    label: "Mistake Analytics",
    description: "Tie recurring mistakes directly to win rate and P&L damage.",
  },
  reviewInsights: {
    requiredPlan: "pro",
    label: "Review Insights",
    description: "Unlock weekly summaries, emotion breakdowns, and adherence signals.",
  },
};

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  starter: 0,
  pro: 1,
  elite: 2,
};

export function hasFeatureAccess(
  plan: SubscriptionPlan,
  feature: BillingFeature
) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[FEATURE_CONFIG[feature].requiredPlan];
}

export function getFeatureConfig(feature: BillingFeature) {
  return FEATURE_CONFIG[feature];
}
