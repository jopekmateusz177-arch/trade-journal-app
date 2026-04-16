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
    <nav className="flex flex-wrap items-center gap-2">
      {primaryNavItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[#2962ff] text-white"
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
