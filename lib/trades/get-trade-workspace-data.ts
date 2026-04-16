import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getUserSubscription, summarizeSubscription } from "../billing/subscriptions";

export async function getTradeWorkspaceData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to load trades:", error.message);
  }

  const subscription = await getUserSubscription(supabase, user.id);

  return {
    user,
    trades: trades ?? [],
    subscription: summarizeSubscription(subscription),
  };
}
