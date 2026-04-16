"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getStripe } from "../../lib/stripe";
import { getPlanPriceId, type PaidPlanKey } from "../../lib/billing/plans";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export async function createCheckoutSession(plan: PaidPlanKey) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const priceId = getPlanPriceId(plan);

  if (!priceId) {
    redirect(
      `/pricing?status=missing_price&plan=${plan}`
    );
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      supabase_user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    },
    success_url: `${appUrl}/pricing?status=success&plan=${plan}`,
    cancel_url: `${appUrl}/pricing?status=cancelled&plan=${plan}`,
  });

  if (!session.url) {
    redirect("/pricing?status=error");
  }

  redirect(session.url);
}
