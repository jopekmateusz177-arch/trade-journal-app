export const PLAN_PRICE_ENV_MAP = {
  pro: "STRIPE_PRICE_PRO",
  elite: "STRIPE_PRICE_ELITE",
} as const;

export type PaidPlanKey = keyof typeof PLAN_PRICE_ENV_MAP;
export type SubscriptionPlan = "starter" | PaidPlanKey;

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

export function getPlanPriceId(plan: PaidPlanKey) {
  return process.env[PLAN_PRICE_ENV_MAP[plan]] ?? null;
}

export function getPlanFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  if (!priceId) {
    return "starter";
  }

  for (const [plan, envName] of Object.entries(PLAN_PRICE_ENV_MAP)) {
    if (process.env[envName] === priceId) {
      return plan as PaidPlanKey;
    }
  }

  return "starter";
}

export function getPlanLabel(plan: SubscriptionPlan) {
  return PLAN_LABELS[plan];
}

export function isPaidPlan(plan: SubscriptionPlan) {
  return plan === "pro" || plan === "elite";
}

export function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  if (plan === "pro" || plan === "elite") {
    return plan;
  }

  return "starter";
}
