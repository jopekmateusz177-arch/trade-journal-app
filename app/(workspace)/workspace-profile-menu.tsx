"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import type { SubscriptionPlan } from "../../lib/billing/plans";

const THEME_STORAGE_KEY = "trade-journal-theme";
const LANGUAGE_STORAGE_KEY = "tradeedge-language";

type WorkspaceProfileMenuProps = {
  userEmail: string;
  subscriptionPlan: SubscriptionPlan;
};

export function WorkspaceProfileMenu({
  userEmail,
  subscriptionPlan,
}: WorkspaceProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [language, setLanguage] = useState("English");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const initials = useMemo(() => {
    const base = userEmail?.trim() || "TE";
    return base.slice(0, 2).toUpperCase();
  }, [userEmail]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setTheme = (theme: "light" | "dark") => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    router.refresh();
    setOpen(false);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111a2c] text-sm font-semibold text-white transition hover:border-[#2962ff]/35 hover:bg-[#14203a]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[300px] rounded-3xl border border-white/10 bg-[#0f1728] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
          <div className="rounded-2xl border border-white/10 bg-[#111a2c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              TradeEdge
            </p>
            <p className="mt-2 text-sm font-medium text-white">{userEmail}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8ea2c9]">
              {subscriptionPlan} plan
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/10 bg-[#111a2c] px-4 py-3 text-sm text-[#dbe4ff] transition hover:border-[#2962ff]/35 hover:bg-[#14203a]"
              onClick={() => setOpen(false)}
            >
              Your Dashboard
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/10 bg-[#111a2c] px-4 py-3 text-sm text-[#dbe4ff] transition hover:border-[#2962ff]/35 hover:bg-[#14203a]"
              onClick={() => setOpen(false)}
            >
              Billing / Subscription
            </Link>
            <Link
              href="/settings"
              className="rounded-2xl border border-white/10 bg-[#111a2c] px-4 py-3 text-sm text-[#dbe4ff] transition hover:border-[#2962ff]/35 hover:bg-[#14203a]"
              onClick={() => setOpen(false)}
            >
              Settings
            </Link>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#111a2c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              Theme
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1220] p-1">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#dbe4ff] transition hover:bg-[#2962ff] hover:text-white"
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#dbe4ff] transition hover:bg-[#2962ff] hover:text-white"
              >
                Dark
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#111a2c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
              Language Preference
            </p>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none"
            >
              {["English", "Polish", "Spanish", "German"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#111a2c] px-4 py-3 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/35 hover:bg-[#14203a]"
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
