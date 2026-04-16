import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { SettingsClient } from "./settings-client";
import {
  getUserSubscription,
  summarizeSubscription,
} from "../../../lib/billing/subscriptions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(supabase, user.id);
  const subscriptionSummary = summarizeSubscription(subscription);

  return (
    <SettingsClient
      userEmail={user.email ?? ""}
      userId={user.id}
      subscriptionSummary={subscriptionSummary}
    />
  );
}
