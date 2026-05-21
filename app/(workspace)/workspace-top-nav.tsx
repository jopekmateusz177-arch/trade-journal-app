"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryNavItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/trades", label: "Trade Log" },
  { href: "/analytics", label: "Analytics" },
  { href: "/review", label: "Review" },
  { href: "/pricing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function WorkspaceTopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-3 lg:gap-4">
      {primaryNavItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[#2962ff] text-white shadow-[0_10px_24px_rgba(41,98,255,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                : "text-[#9fb0d1] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
