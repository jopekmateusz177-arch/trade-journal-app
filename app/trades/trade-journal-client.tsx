"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Trade = {
  id: number;
  user_id?: string;
  date: string;
  ticker: string;
  side: "Long" | "Short";
  entry: number;
  exit: number;
  shares: number;
  setup: string;
  notes: string;
  mistakes: string[];
  pnl: number;
  created_at?: string;
};

type ThemeMode = "light" | "dark";

type Props = {
  userId: string;
  userEmail: string;
  initialTrades: Trade[];
};

const THEME_STORAGE_KEY = "trade-journal-theme";

const mistakeOptions = [
  "FOMO Entry",
  "No Stop Loss",
  "Oversized Position",
  "Early Exit",
  "Revenge Trade",
  "No Plan",
];

function calculatePnL(
  entry: number,
  exit: number,
  shares: number,
  side: "Long" | "Short"
) {
  return side === "Long" ? (exit - entry) * shares : (entry - exit) * shares;
}

export default function TradeJournalClient({
  userId,
  userEmail,
  initialTrades,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [date, setDate] = useState("");
  const [ticker, setTicker] = useState("");
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [shares, setShares] = useState("");
  const [setup, setSetup] = useState("");
  const [notes, setNotes] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);

  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  const [tickerFilter, setTickerFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [mistakeFilter, setMistakeFilter] = useState("All");

  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const resetForm = () => {
    setDate("");
    setTicker("");
    setSide("Long");
    setEntry("");
    setExit("");
    setShares("");
    setSetup("");
    setNotes("");
    setMistakes([]);
    setEditingTradeId(null);
  };

  const livePnL = useMemo(() => {
    const entryNum = Number(entry);
    const exitNum = Number(exit);
    const sharesNum = Number(shares);

    if (!entry || !exit || !shares) return 0;
    if ([entryNum, exitNum, sharesNum].some((n) => Number.isNaN(n))) return 0;

    return calculatePnL(entryNum, exitNum, sharesNum, side);
  }, [entry, exit, shares, side]);

  const totalPnL = useMemo(
    () => trades.reduce((sum, trade) => sum + Number(trade.pnl), 0),
    [trades]
  );

  const winRate = useMemo(() => {
    if (!trades.length) return 0;
    const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
    return (wins / trades.length) * 100;
  }, [trades]);

  const averagePnL = useMemo(() => {
    if (!trades.length) return 0;
    return totalPnL / trades.length;
  }, [trades, totalPnL]);

  const averageWin = useMemo(() => {
  const wins = trades.filter((trade) => Number(trade.pnl) > 0);
  if (!wins.length) return 0;
  return wins.reduce((sum, trade) => sum + Number(trade.pnl), 0) / wins.length;
}, [trades]);

const averageLoss = useMemo(() => {
  const losses = trades.filter((trade) => Number(trade.pnl) < 0);
  if (!losses.length) return 0;
  return losses.reduce((sum, trade) => sum + Number(trade.pnl), 0) / losses.length;
}, [trades]);

const largestWin = useMemo(() => {
  const wins = trades.filter((trade) => Number(trade.pnl) > 0);
  if (!wins.length) return 0;
  return Math.max(...wins.map((trade) => Number(trade.pnl)));
}, [trades]);

const largestLoss = useMemo(() => {
  const losses = trades.filter((trade) => Number(trade.pnl) < 0);
  if (!losses.length) return 0;
  return Math.min(...losses.map((trade) => Number(trade.pnl)));
}, [trades]);

const expectancy = useMemo(() => {
  if (!trades.length) return 0;

  const wins = trades.filter((trade) => Number(trade.pnl) > 0);
  const losses = trades.filter((trade) => Number(trade.pnl) < 0);

  const winRateDecimal = wins.length / trades.length;
  const lossRateDecimal = losses.length / trades.length;

  const avgWin =
    wins.length > 0
      ? wins.reduce((sum, trade) => sum + Number(trade.pnl), 0) / wins.length
      : 0;

  const avgLossAbs =
    losses.length > 0
      ? Math.abs(
          losses.reduce((sum, trade) => sum + Number(trade.pnl), 0) / losses.length
        )
      : 0;

  return winRateDecimal * avgWin - lossRateDecimal * avgLossAbs;
}, [trades]);




  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const tickerMatches =
        !tickerFilter ||
        trade.ticker.toLowerCase().includes(tickerFilter.toLowerCase());

      const setupMatches =
        !setupFilter ||
        (trade.setup || "").toLowerCase().includes(setupFilter.toLowerCase());

      const mistakeMatches =
        mistakeFilter === "All" || trade.mistakes.includes(mistakeFilter);

      return tickerMatches && setupMatches && mistakeMatches;
    });
  }, [trades, tickerFilter, setupFilter, mistakeFilter]);

  const filteredTotalPnL = useMemo(
    () => filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0),
    [filteredTrades]
  );

  const cumulativePnL = useMemo(() => {
    let runningTotal = 0;

    return [...filteredTrades]
      .reverse()
      .map((trade) => {
        runningTotal += Number(trade.pnl);
        return {
          id: trade.id,
          value: runningTotal,
        };
      });
  }, [filteredTrades]);

  const maxDrawdown = useMemo(() => {
  if (!cumulativePnL.length) return 0;

  let peak = cumulativePnL[0].value;
  let maxDd = 0;

  for (const point of cumulativePnL) {
    if (point.value > peak) peak = point.value;
    const drawdown = peak - point.value;
    if (drawdown > maxDd) maxDd = drawdown;
  }

    return maxDd;
  }, [cumulativePnL]);

  const chartStats = useMemo(() => {
    if (!cumulativePnL.length) {
      return {
        points: "",
        min: 0,
        max: 0,
      };
    }

    const values = cumulativePnL.map((point) => point.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    const points = cumulativePnL
      .map((point, index) => {
        const x =
          cumulativePnL.length === 1
            ? 50
            : (index / (cumulativePnL.length - 1)) * 100;
        const y = 100 - ((point.value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return { points, min, max };
  }, [cumulativePnL]);

  const toggleMistake = (mistake: string) => {
    setMistakes((prev) =>
      prev.includes(mistake)
        ? prev.filter((item) => item !== mistake)
        : [...prev, mistake]
    );
  };

  const editTrade = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setDate(trade.date);
    setTicker(trade.ticker);
    setSide(trade.side);
    setEntry(String(trade.entry));
    setExit(String(trade.exit));
    setShares(String(trade.shares));
    setSetup(trade.setup || "");
    setNotes(trade.notes || "");
    setMistakes(trade.mistakes || []);
    setStatusMessage("");
  };

  const submitTrade = async () => {
    const entryNum = Number(entry);
    const exitNum = Number(exit);
    const sharesNum = Number(shares);

    if (!date || !ticker || !entry || !exit || !shares) {
      setStatusMessage("Fill in date, ticker, entry, exit, and shares.");
      return;
    }

    if ([entryNum, exitNum, sharesNum].some((n) => Number.isNaN(n))) {
      setStatusMessage("Entry, exit, and shares must be valid numbers.");
      return;
    }

    const tradePayload = {
      user_id: userId,
      date,
      ticker: ticker.toUpperCase(),
      side,
      entry: entryNum,
      exit: exitNum,
      shares: sharesNum,
      setup,
      notes,
      mistakes,
      pnl: calculatePnL(entryNum, exitNum, sharesNum, side),
    };

    try {
      setSaving(true);
      setStatusMessage("");

      if (editingTradeId !== null) {
        const { data, error } = await supabase
          .from("trades")
          .update(tradePayload)
          .eq("id", editingTradeId)
          .select()
          .single();

        if (error) {
          setStatusMessage(error.message);
          return;
        }

        setTrades((prev) =>
          prev.map((trade) => (trade.id === editingTradeId ? data : trade))
        );
        setStatusMessage("Trade updated.");
      } else {
        const { data, error } = await supabase
          .from("trades")
          .insert(tradePayload)
          .select()
          .single();

        if (error) {
          setStatusMessage(error.message);
          return;
        }

        setTrades((prev) => [data, ...prev]);
        setStatusMessage("Trade added.");
      }

      resetForm();
    } catch (error) {
      console.error(error);
      setStatusMessage("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTrade = async (id: number) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setTrades((prev) => prev.filter((trade) => trade.id !== id));

    if (editingTradeId === id) {
      resetForm();
    }
  };

  const clearAllTrades = async () => {
    if (!window.confirm("Delete all your trades? This cannot be undone.")) {
      return;
    }

    const { error } = await supabase.from("trades").delete().eq("user_id", userId);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setTrades([]);
    resetForm();
    setStatusMessage("All trades cleared.");
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const styles = {
    page:
      theme === "dark"
        ? "min-h-screen bg-[#0a0f1a] text-[#e5e7eb]"
        : "min-h-screen bg-[#f5f7fb] text-[#111827]",
    shell: "mx-auto max-w-7xl px-6 py-8 md:px-10",
    topBar:
      theme === "dark"
        ? "mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#111827]/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between"
        : "mb-8 flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between",
    card:
      theme === "dark"
        ? "rounded-3xl border border-white/10 bg-[#131c31] shadow-[0_20px_80px_rgba(0,0,0,0.30)]"
        : "rounded-3xl border border-black/10 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]",
    muted: theme === "dark" ? "text-[#94a3b8]" : "text-[#6b7280]",
    input:
      theme === "dark"
        ? "w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#64748b] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/30"
        : "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/20",
    textarea:
      theme === "dark"
        ? "min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#64748b] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/30"
        : "min-h-[110px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#2962ff] focus:ring-2 focus:ring-[#2962ff]/20",
    buttonPrimary:
      theme === "dark"
        ? "rounded-2xl bg-[#2962ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b73ff]"
        : "rounded-2xl bg-[#2962ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f56f5]",
    buttonSecondary:
      theme === "dark"
        ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-medium text-[#dbe4ff] transition hover:border-[#2962ff]/60 hover:text-white"
        : "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#374151] transition hover:border-[#2962ff]/40 hover:text-[#111827]",
    buttonDanger:
      theme === "dark"
        ? "rounded-2xl border border-[#ff4d4f]/20 bg-[#2a1116] px-4 py-3 text-sm font-semibold text-[#ff7a7c] transition hover:border-[#ff4d4f]/40 hover:text-white"
        : "rounded-2xl border border-[#ff4d4f]/20 bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#d9363e] transition hover:border-[#ff4d4f]/40",
    pill:
      theme === "dark"
        ? "rounded-full border border-white/10 bg-[#0b1220] px-3 py-2 text-xs font-medium text-[#cbd5e1] transition hover:border-[#2962ff]/40"
        : "rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#4b5563] transition hover:border-[#2962ff]/30",
    pillActive:
      "rounded-full border border-[#2962ff]/30 bg-[#2962ff]/12 px-3 py-2 text-xs font-semibold text-[#2962ff]",
    tableHead: theme === "dark" ? "text-[#8ea2c9]" : "text-[#6b7280]",
    row: theme === "dark" ? "border-t border-white/10" : "border-t border-black/10",
    positive: "text-[#00c076]",
    negative: "text-[#ff4d4f]",
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div>
            <p
              className={`mb-2 text-xs font-semibold uppercase tracking-[0.28em] ${styles.muted}`}
            >
              Trading Journal Dashboard
            </p>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Track trades like a professional
            </h1>

            <p className={`mt-2 max-w-2xl text-sm md:text-base ${styles.muted}`}>
              Synced with your account. Your trades are now tied to your login,
              not just one browser.
            </p>

            {userEmail && (
              <p className="mt-2 text-sm text-[#94a3b8]">
                Signed in as {userEmail}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setTheme("light")}
              className={`${theme === "light" ? styles.buttonPrimary : styles.buttonSecondary} min-w-[96px]`}
            >
              Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`${theme === "dark" ? styles.buttonPrimary : styles.buttonSecondary} min-w-[96px]`}
            >
              Dark
            </button>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className={styles.buttonDanger}
            >
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`${styles.card} mb-6 px-5 py-4 text-sm ${
              statusMessage.toLowerCase().includes("wrong") ||
              statusMessage.toLowerCase().includes("failed") ||
              statusMessage.toLowerCase().includes("error")
                ? styles.negative
                : styles.positive
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className={`${styles.card} p-6 md:p-7`}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {editingTradeId !== null ? "Edit Trade" : "Add Trade"}
                  </h2>
                  <p className={`mt-1 text-sm ${styles.muted}`}>
                    Log the trade, the setup, and the mistakes you want to stop
                    repeating.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Ticker
                  </label>
                  <input
                    placeholder="AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSide("Long")}
                      className={side === "Long" ? styles.buttonPrimary : styles.buttonSecondary}
                    >
                      Long
                    </button>
                    <button
                      onClick={() => setSide("Short")}
                      className={side === "Short" ? styles.buttonPrimary : styles.buttonSecondary}
                    >
                      Short
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                      Entry Price
                    </label>
                    <input
                      type="number"
                      placeholder="100.00"
                      value={entry}
                      onChange={(e) => setEntry(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                      Exit Price
                    </label>
                    <input
                      type="number"
                      placeholder="105.00"
                      value={exit}
                      onChange={(e) => setExit(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Shares
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Setup
                  </label>
                  <input
                    placeholder="Breakout, pullback, opening range..."
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Notes
                  </label>
                  <textarea
                    placeholder="Why did you take it? What would you do differently?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={styles.textarea}
                  />
                </div>

                <div>
                  <label className={`mb-3 block text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Mistake Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {mistakeOptions.map((mistake) => (
                      <button
                        key={mistake}
                        type="button"
                        onClick={() => toggleMistake(mistake)}
                        className={mistakes.includes(mistake) ? styles.pillActive : styles.pill}
                      >
                        {mistake}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={
                    theme === "dark"
                      ? "rounded-3xl border border-white/10 bg-[#0b1220] p-5"
                      : "rounded-3xl border border-black/10 bg-[#f8fafc] p-5"
                  }
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Live P&amp;L
                  </p>
                  <p
                    className={`mt-3 text-3xl font-semibold tracking-tight ${
                      livePnL >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {livePnL >= 0 ? "+" : ""}${livePnL.toFixed(2)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={submitTrade}
                    disabled={saving}
                    className={`${styles.buttonPrimary} w-full`}
                  >
                    {saving
                      ? "Saving..."
                      : editingTradeId !== null
                      ? "Save Changes"
                      : "Add Trade"}
                  </button>
                  <button
                    onClick={resetForm}
                    className={`${styles.buttonSecondary} w-full`}
                  >
                    {editingTradeId !== null ? "Cancel Edit" : "Clear Form"}
                  </button>
                </div>
              </div>
            </div>

           <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-2">
  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Total P&amp;L
    </p>
    <p
      className={`mt-3 text-2xl font-semibold tracking-tight ${
        totalPnL >= 0 ? styles.positive : styles.negative
      }`}
    >
      {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Win Rate
    </p>
    <p className="mt-3 text-2xl font-semibold tracking-tight">
      {winRate.toFixed(1)}%
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Average P&amp;L
    </p>
    <p
      className={`mt-3 text-2xl font-semibold tracking-tight ${
        averagePnL >= 0 ? styles.positive : styles.negative
      }`}
    >
      {averagePnL >= 0 ? "+" : ""}${averagePnL.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Average Win
    </p>
    <p className={`mt-3 text-2xl font-semibold tracking-tight ${styles.positive}`}>
      +${averageWin.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Average Loss
    </p>
    <p className={`mt-3 text-2xl font-semibold tracking-tight ${styles.negative}`}>
      ${averageLoss.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Largest Win
    </p>
    <p className={`mt-3 text-2xl font-semibold tracking-tight ${styles.positive}`}>
      +${largestWin.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Largest Loss
    </p>
    <p className={`mt-3 text-2xl font-semibold tracking-tight ${styles.negative}`}>
      ${largestLoss.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Expectancy
    </p>
    <p
      className={`mt-3 text-2xl font-semibold tracking-tight ${
        expectancy >= 0 ? styles.positive : styles.negative
      }`}
    >
      {expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}
    </p>
  </div>

  <div className={`${styles.card} p-5`}>
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
      Max Drawdown
    </p>
    <p className={`mt-3 text-2xl font-semibold tracking-tight ${styles.negative}`}>
      -${maxDrawdown.toFixed(2)}
    </p>
  </div>
</div>

              <div className={`${styles.card} p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                  Win Rate
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {winRate.toFixed(1)}%
                </p>
              </div>

              <div className={`${styles.card} p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                  Average P&amp;L
                </p>
                <p
                  className={`mt-3 text-2xl font-semibold tracking-tight ${
                    averagePnL >= 0 ? styles.positive : styles.negative
                  }`}
                >
                  {averagePnL >= 0 ? "+" : ""}${averagePnL.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${styles.card} overflow-hidden`}>
              <div
                className={
                  theme === "dark"
                    ? "flex flex-col gap-5 border-b border-white/10 px-6 py-5"
                    : "flex flex-col gap-5 border-b border-black/10 px-6 py-5"
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Trade History</h2>
                    <p className={`mt-1 text-sm ${styles.muted}`}>
                      Review each execution first, then judge the performance curve.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={
                        theme === "dark"
                          ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-[#94a3b8]"
                          : "rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-2 text-sm text-[#6b7280]"
                      }
                    >
                      {filteredTrades.length} shown / {trades.length} total
                    </div>

                    <button onClick={clearAllTrades} className={styles.buttonDanger}>
                      Clear All Trades
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <input
                    value={tickerFilter}
                    onChange={(e) => setTickerFilter(e.target.value)}
                    placeholder="Filter by ticker"
                    className={styles.input}
                  />
                  <input
                    value={setupFilter}
                    onChange={(e) => setSetupFilter(e.target.value)}
                    placeholder="Filter by setup"
                    className={styles.input}
                  />
                  <select
                    value={mistakeFilter}
                    onChange={(e) => setMistakeFilter(e.target.value)}
                    className={styles.input}
                  >
                    <option value="All">All mistake tags</option>
                    {mistakeOptions.map((mistake) => (
                      <option key={mistake} value={mistake}>
                        {mistake}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredTrades.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6 py-10">
                  <div className="text-center">
                    <p className="text-xl font-semibold tracking-tight">No matching trades</p>
                    <p className={`mt-2 text-sm ${styles.muted}`}>
                      Adjust your filters or add a new trade.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left">
                    <thead>
                      <tr className={theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Date</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Ticker</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Side</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Entry</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Exit</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Shares</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Setup</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Mistakes</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Notes</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>P&amp;L</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade) => (
                        <tr key={trade.id} className={styles.row}>
                          <td className="px-6 py-4 text-sm font-medium">{trade.date}</td>
                          <td className="px-6 py-4 text-sm font-semibold tracking-wide">
                            {trade.ticker}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={
                                trade.side === "Long"
                                  ? "rounded-full border border-[#00c076]/20 bg-[#00c076]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#00c076]"
                                  : "rounded-full border border-[#ff4d4f]/20 bg-[#ff4d4f]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff4d4f]"
                              }
                            >
                              {trade.side}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">${Number(trade.entry).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">${Number(trade.exit).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">{trade.shares}</td>
                          <td className="px-6 py-4 text-sm">{trade.setup || "—"}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex max-w-[220px] flex-wrap gap-2">
                              {trade.mistakes.length > 0 ? (
                                trade.mistakes.map((mistake) => (
                                  <span
                                    key={mistake}
                                    className="rounded-full border border-[#ffb020]/20 bg-[#ffb020]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ffb020]"
                                  >
                                    {mistake}
                                  </span>
                                ))
                              ) : (
                                <span className={styles.muted}>—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-[240px] whitespace-pre-wrap break-words leading-6">
                              {trade.notes || "—"}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-semibold ${
                              Number(trade.pnl) >= 0 ? styles.positive : styles.negative
                            }`}
                          >
                            {Number(trade.pnl) >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editTrade(trade)}
                                className={styles.buttonSecondary}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTrade(trade.id)}
                                className={styles.buttonDanger}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={`${styles.card} p-6`}>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Performance Curve</h2>
                  <p className={`mt-1 text-sm ${styles.muted}`}>
                    Cumulative P&amp;L for the trades currently shown by your filters.
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                    Filtered Equity
                  </p>
                  <p
                    className={`mt-1 text-xl font-semibold ${
                      filteredTotalPnL >= 0 ? styles.positive : styles.negative
                    }`}
                  >
                    {filteredTotalPnL >= 0 ? "+" : ""}${filteredTotalPnL.toFixed(2)}
                  </p>
                </div>
              </div>

              {cumulativePnL.length === 0 ? (
                <div
                  className={
                    theme === "dark"
                      ? "flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-[#0b1220] text-center"
                      : "flex min-h-[260px] items-center justify-center rounded-3xl border border-black/10 bg-[#f8fafc] text-center"
                  }
                >
                  <div>
                    <p className="text-lg font-semibold">No performance data yet</p>
                    <p className={`mt-2 text-sm ${styles.muted}`}>
                      Your chart appears after matching trades are shown.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    theme === "dark"
                      ? "rounded-3xl border border-white/10 bg-[#0b1220] p-5"
                      : "rounded-3xl border border-black/10 bg-[#f8fafc] p-5"
                  }
                >
                  <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em]">
                    <span className={styles.muted}>Min ${chartStats.min.toFixed(2)}</span>
                    <span className={styles.muted}>Max ${chartStats.max.toFixed(2)}</span>
                  </div>

                  <div className="h-[260px] w-full">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="h-full w-full overflow-visible"
                    >
                      <line
                        x1="0"
                        y1="100"
                        x2="100"
                        y2="100"
                        stroke={
                          theme === "dark"
                            ? "rgba(148,163,184,0.2)"
                            : "rgba(107,114,128,0.2)"
                        }
                        strokeWidth="1"
                      />
                      <line
                        x1="0"
                        y1="50"
                        x2="100"
                        y2="50"
                        stroke={
                          theme === "dark"
                            ? "rgba(148,163,184,0.14)"
                            : "rgba(107,114,128,0.14)"
                        }
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <line
                        x1="0"
                        y1="0"
                        x2="100"
                        y2="0"
                        stroke={
                          theme === "dark"
                            ? "rgba(148,163,184,0.2)"
                            : "rgba(107,114,128,0.2)"
                        }
                        strokeWidth="1"
                      />
                      <polyline
                        fill="none"
                        stroke="#2962ff"
                        strokeWidth="2.5"
                        points={chartStats.points}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                        Trades Shown
                      </p>
                      <p className="mt-1 text-lg font-semibold">{filteredTrades.length}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                        Best Run
                      </p>
                      <p className={`mt-1 text-lg font-semibold ${styles.positive}`}>
                        ${chartStats.max.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}>
                        Worst Drawdown Point
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          chartStats.min < 0 ? styles.negative : styles.muted
                        }`}
                      >
                        ${chartStats.min.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    
  );
}