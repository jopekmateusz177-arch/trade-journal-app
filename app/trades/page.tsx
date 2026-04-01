import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import TradeJournalClient from "./trade-journal-client";

export default async function TradesPage() {
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
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to load trades:", error.message);
  }

  return (
    <TradeJournalClient
      userId={user.id}
      userEmail={user.email ?? ""}
      initialTrades={trades ?? []}
    />
  );
}