"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasFeatureAccess } from "../../lib/billing/access";
import type { SubscriptionPlan } from "../../lib/billing/plans";

const navItems = [
  { href: "/dashboard", label: "Dashboard", description: "Overview and momentum" },
  { href: "/trades", label: "Trades", description: "Journal and history" },
  { href: "/analytics", label: "Analytics", description: "Equity and metrics", premiumFeature: "advancedAnalytics" as const },
  { href: "/review", label: "Review", description: "Calendar and weekly review", premiumFeature: "reviewInsights" as const },
  { href: "/pricing", label: "Pricing", description: "Plans and upgrade flow" },
  { href: "/setups", label: "Setups", description: "Pattern performance", premiumFeature: "setupAnalytics" as const },
  { href: "/mistakes", label: "Mistakes", description: "Execution review", premiumFeature: "mistakeAnalytics" as const },
  { href: "/settings", label: "Settings", description: "Account and product" },
];

export function WorkspaceSidebarNav({ plan }: { plan: SubscriptionPlan }) {
  const pathname = usePathname();

  return (
    <nav className="mt-5 grid gap-3">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isPremium = item.premiumFeature
          ? !hasFeatureAccess(plan, item.premiumFeature)
          : false;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl border px-4 py-3 transition ${
              isActive
                ? "border-[#2962ff]/40 bg-[#13203a] shadow-[inset_0_0_0_1px_rgba(41,98,255,0.12)]"
                : "border-white/10 bg-[#0b1220] hover:border-[#2962ff]/40 hover:bg-[#101a2f]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              {isPremium ? (
                <span className="rounded-full border border-[#2962ff]/25 bg-[#2962ff]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#dbe4ff]">
                  Pro
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-5 text-[#8ea2c9]">
              {item.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
