import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../supabase/admin";
import type { Database } from "../supabase/database";
import { getPlanFromPriceId, normalizePlan, type SubscriptionPlan } from "./plans";

export type SubscriptionRecord = Database["public"]["Tables"]["subscriptions"]["Row"];

export type SubscriptionSummary = {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasActiveAccess: boolean;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function toIsoDate(timestamp: number | null | undefined) {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function stringifyMetadata(
  metadata: Record<string, string | null | undefined> | Stripe.Metadata
) {
  return Object.fromEntries(
    Object.entries(metadata).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : []
    )
  );
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

async function findSubscriptionByStripeIds(
  admin: SupabaseClient<Database>,
  {
    stripeSubscriptionId,
    stripeCustomerId,
  }: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  }
) {
  if (stripeSubscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (data) {
      return data;
    }
  }

  if (stripeCustomerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (data) {
      return data;
    }
  }

  return null;
}

async function resolveSubscriptionUserId(
  admin: SupabaseClient<Database>,
  subscription: Stripe.Subscription,
  userIdHint?: string | null
) {
  const metadataUserId = subscription.metadata.supabase_user_id;

  if (metadataUserId) {
    return metadataUserId;
  }

  if (userIdHint) {
    return userIdHint;
  }

  const existing = await findSubscriptionByStripeIds(admin, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: getCustomerId(subscription.customer),
  });

  return existing?.user_id ?? null;
}

export function summarizeSubscription(
  subscription: Partial<SubscriptionRecord> | null | undefined
): SubscriptionSummary {
  const plan = normalizePlan(subscription?.plan ?? "starter");
  const status = subscription?.status ?? "inactive";

  return {
    plan,
    status,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    hasActiveAccess: ACTIVE_STATUSES.has(status),
  };
}

export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subscription:", error.message);
    return null;
  }

  return data;
}

export async function upsertSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
  options?: {
    userIdHint?: string | null;
  }
) {
  const admin = createAdminClient();
  const userId = await resolveSubscriptionUserId(
    admin,
    subscription,
    options?.userIdHint
  );

  if (!userId) {
    throw new Error(
      `Unable to resolve Supabase user for Stripe subscription ${subscription.id}`
    );
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const currentPeriodStart = subscription.items.data[0]?.current_period_start ?? null;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;
  const metadataPlan = normalizePlan(subscription.metadata.plan);
  const resolvedPlan =
    metadataPlan === "starter" ? getPlanFromPriceId(priceId) : metadataPlan;

  const payload = {
    user_id: userId,
    stripe_customer_id: getCustomerId(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: resolvedPlan,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: toIsoDate(currentPeriodStart ?? subscription.billing_cycle_anchor),
    current_period_end: toIsoDate(currentPeriodEnd),
    started_at: toIsoDate(subscription.start_date),
    ended_at: toIsoDate(subscription.ended_at ?? subscription.canceled_at),
    metadata: stringifyMetadata(subscription.metadata),
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("subscriptions").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}
