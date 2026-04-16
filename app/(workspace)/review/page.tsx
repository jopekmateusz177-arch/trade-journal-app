import { TradeReviewCalendar } from "../../trades/components/trade-review-calendar";
import { getTradeWorkspaceData } from "../../../lib/trades/get-trade-workspace-data";

export default async function ReviewPage() {
  const { trades, subscription } = await getTradeWorkspaceData();

  return <TradeReviewCalendar trades={trades} subscriptionPlan={subscription.plan} />;
}
