import Link from "next/link";
import {
  getPlanLabel,
  type SubscriptionPlan,
} from "../../lib/billing/plans";
import {
  getFeatureConfig,
  type BillingFeature,
} from "../../lib/billing/access";

type FeatureLockCardProps = {
  feature: BillingFeature;
  currentPlan: SubscriptionPlan;
};

export function FeatureLockCard({
  feature,
  currentPlan,
}: FeatureLockCardProps) {
  const config = getFeatureConfig(feature);

  return (
    <div className="rounded-3xl border border-[#2962ff]/25 bg-[#101a2f] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
            {config.label} - {getPlanLabel(config.requiredPlan)}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Keep core journaling simple. Unlock deeper insight when you need it.
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3b8]">
            {config.description} You are currently on the{" "}
            {getPlanLabel(currentPlan)} plan.
          </p>
        </div>

        <Link
          href="/pricing"
          className="rounded-2xl bg-[#2962ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff]"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
