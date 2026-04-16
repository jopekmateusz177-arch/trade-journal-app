import TradeJournalClient from "../../trades/trade-journal-client";
import { getTradeWorkspaceData } from "../../../lib/trades/get-trade-workspace-data";

export default async function DashboardPage() {
  const { user, trades, subscription } = await getTradeWorkspaceData();

  return (
    <TradeJournalClient
      userId={user.id}
      userEmail={user.email ?? ""}
      initialTrades={trades}
      subscriptionPlan={subscription.plan}
      view="dashboard"
    />
  );
}
