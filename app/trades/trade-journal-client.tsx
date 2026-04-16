"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeatureLockCard } from "../components/feature-lock-card";
import { hasFeatureAccess } from "../../lib/billing/access";
import type { SubscriptionPlan } from "../../lib/billing/plans";
import { createClient } from "../../lib/supabase/client";
import { AnalyticsMetricsGrid } from "./components/analytics-metrics-grid";
import { JournalSectionHeader } from "./components/journal-section-header";
import { JournalStatCard } from "./components/journal-stat-card";
import { TradeFormSection } from "./components/trade-form-section";
import { TradeHistorySection } from "./components/trade-history-section";
import type { SortField, Trade } from "./types";

type ThemeMode = "light" | "dark";

type WorkspaceView =
  | "workspace"
  | "dashboard"
  | "trades"
  | "analytics"
  | "setups"
  | "mistakes"
  | "review";

type Props = {
  userId: string;
  userEmail: string;
  initialTrades: Trade[];
  subscriptionPlan: SubscriptionPlan;
  view?: WorkspaceView;
};

const THEME_STORAGE_KEY = "trade-journal-theme";
const SAVED_VIEWS_STORAGE_KEY = "trade-journal-saved-views";

type SavedView = {
  id: string;
  name: string;
  tickerFilter: string;
  setupFilter: string;
  mistakeFilter: string;
};

const mistakeOptions = [
  "FOMO Entry",
  "No Stop Loss",
  "Oversized Position",
  "Early Exit",
  "Revenge Trade",
  "No Plan",
];

const setupOptions = [
  "Breakout",
  "Pullback",
  "Opening Range Breakout",
  "Reversal",
  "Trend Continuation",
  "Support/Resistance Bounce",
  "VWAP Reclaim",
  "Other",
];

const workspaceSections = [
  {
    id: "overview",
    label: "Overview",
    description: "Snapshot and product direction",
  },
  {
    id: "journal",
    label: "Journal",
    description: "Log and edit trades",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Review edge and equity curve",
  },
  {
    id: "setups",
    label: "Setups",
    description: "Compare setup performance",
  },
  {
    id: "mistakes",
    label: "Mistakes",
    description: "Spot recurring leaks",
  },
  {
    id: "history",
    label: "History",
    description: "Search, sort, and export",
  },
] as const;

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
  subscriptionPlan,
  view = "workspace",
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
  const [, setSetup] = useState("");
  const [notes, setNotes] = useState("");
  const [adherenceScore, setAdherenceScore] = useState("");
  const [confidenceScore, setConfidenceScore] = useState("");
  const [emotion, setEmotion] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [selectedSetup, setSelectedSetup] = useState("");
  const [customSetup, setCustomSetup] = useState("");

  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>(initialTrades);

  const [tickerFilter, setTickerFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [mistakeFilter, setMistakeFilter] = useState("All");

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(
      THEME_STORAGE_KEY
    ) as ThemeMode | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const storedViews = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);

    if (!storedViews) return;

    try {
      const parsed = JSON.parse(storedViews) as SavedView[];
      setSavedViews(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedViews([]);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews, mounted]);

    const resetForm = () => {
    setDate("");
    setTicker("");
    setSide("Long");
    setEntry("");
    setExit("");
    setShares("");
    setSetup("");
    setSelectedSetup("");
    setCustomSetup("");
    setNotes("");
    setAdherenceScore("");
    setConfidenceScore("");
    setEmotion("");
    setLessonLearned("");
    setReviewCompleted(false);
    setMistakes([]);
    setScreenshotFile(null);
    setExistingScreenshotUrl("");
    setEditingTradeId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "date" ? "desc" : "asc");
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "+/-";
    return sortDirection === "asc" ? "^" : "v";
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
    return (
      wins.reduce((sum, trade) => sum + Number(trade.pnl), 0) / wins.length
    );
  }, [trades]);

  const averageLoss = useMemo(() => {
    const losses = trades.filter((trade) => Number(trade.pnl) < 0);
    if (!losses.length) return 0;
    return (
      losses.reduce((sum, trade) => sum + Number(trade.pnl), 0) / losses.length
    );
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
            losses.reduce((sum, trade) => sum + Number(trade.pnl), 0) /
              losses.length
          )
        : 0;

    return winRateDecimal * avgWin - lossRateDecimal * avgLossAbs;
  }, [trades]);

  const profitFactor = useMemo(() => {
    const wins = trades.filter((t) => Number(t.pnl) > 0);
    const losses = trades.filter((t) => Number(t.pnl) < 0);

    const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0);
    const grossLoss = losses.reduce((sum, t) => sum + Number(t.pnl), 0);

    if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;

    return grossProfit / Math.abs(grossLoss);
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

  const sortedTrades = useMemo(() => {
    const sorted = [...filteredTrades];

    sorted.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortField) {
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "ticker":
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case "side":
          aValue = a.side;
          bValue = b.side;
          break;
        case "entry":
          aValue = Number(a.entry);
          bValue = Number(b.entry);
          break;
        case "exit":
          aValue = Number(a.exit);
          bValue = Number(b.exit);
          break;
        case "shares":
          aValue = Number(a.shares);
          bValue = Number(b.shares);
          break;
        case "setup":
          aValue = a.setup || "";
          bValue = b.setup || "";
          break;
        case "pnl":
          aValue = Number(a.pnl);
          bValue = Number(b.pnl);
          break;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredTrades, sortField, sortDirection]);

  const filteredTotalPnL = useMemo(
    () => filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0),
    [filteredTrades]
  );

  const filteredWinRate = useMemo(() => {
    if (!filteredTrades.length) return 0;
    const wins = filteredTrades.filter((trade) => Number(trade.pnl) > 0).length;
    return (wins / filteredTrades.length) * 100;
  }, [filteredTrades]);

  const recentTrades = useMemo(() => sortedTrades.slice(0, 4), [sortedTrades]);
  const hasAdvancedAnalytics = hasFeatureAccess(subscriptionPlan, "advancedAnalytics");
  const hasSetupAnalytics = hasFeatureAccess(subscriptionPlan, "setupAnalytics");
  const hasMistakeAnalytics = hasFeatureAccess(subscriptionPlan, "mistakeAnalytics");
  const latestTradeTemplate = useMemo(() => trades[0] ?? null, [trades]);

  const reviewCompletion = useMemo(() => {
    const reviewed = trades.filter((trade) => trade.review_completed).length;
    const pending = trades.length - reviewed;

    return {
      reviewed,
      pending,
      rate: trades.length ? (reviewed / trades.length) * 100 : 0,
    };
  }, [trades]);

  const monthPnL = useMemo(() => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    return trades
      .filter((trade) => trade.date.startsWith(currentMonth))
      .reduce((sum, trade) => sum + Number(trade.pnl), 0);
  }, [trades]);

  const visibleSections = useMemo(() => {
    switch (view) {
      case "dashboard":
        return {
          overview: true,
          journal: false,
          analytics: true,
          setups: true,
          mistakes: true,
          history: false,
        };
      case "trades":
        return {
          overview: false,
          journal: true,
          analytics: false,
          setups: false,
          mistakes: false,
          history: true,
        };
      case "analytics":
        return {
          overview: false,
          journal: false,
          analytics: true,
          setups: false,
          mistakes: false,
          history: false,
        };
      case "setups":
        return {
          overview: false,
          journal: false,
          analytics: false,
          setups: true,
          mistakes: false,
          history: false,
        };
      case "mistakes":
        return {
          overview: false,
          journal: false,
          analytics: false,
          setups: false,
          mistakes: true,
          history: false,
        };
      case "review":
        return {
          overview: false,
          journal: false,
          analytics: false,
          setups: false,
          mistakes: false,
          history: false,
        };
      default:
        return {
          overview: true,
          journal: true,
          analytics: true,
          setups: true,
          mistakes: true,
          history: true,
        };
    }
  }, [view]);

  const pageTitle =
    view === "dashboard"
      ? "Trading Journal Dashboard"
      : view === "trades"
      ? "Trades Workspace"
      : view === "analytics"
      ? "Analytics Workspace"
      : view === "setups"
      ? "Setup Performance"
      : view === "mistakes"
      ? "Mistake Review"
      : view === "review"
      ? "Review Workspace"
      : "Trading Journal Dashboard";

  const pageDescription =
    view === "dashboard"
      ? "Review the health of the journal, key metrics, and your latest trading activity."
      : view === "trades"
      ? "Log trades, update executions, and keep the journal clean and searchable."
      : view === "analytics"
      ? "Study performance, expectancy, and equity curve behavior."
      : view === "setups"
      ? "See which patterns are paying you and which need tighter rules."
      : view === "mistakes"
      ? "Find repeatable execution leaks and psychology mistakes."
      : view === "review"
      ? "Inspect trades by day and week, then review execution quality."
      : "Synced with your account. Your trades are now tied to your login, not just one browser.";

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

  const setupAnalytics = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};

    for (const trade of trades) {
      const key = trade.setup?.trim() || "No Setup";

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(trade);
    }

    return Object.entries(grouped)
      .map(([setupName, setupTrades]) => {
        const totalTrades = setupTrades.length;

        const wins = setupTrades.filter((t) => Number(t.pnl) > 0);
        const losses = setupTrades.filter((t) => Number(t.pnl) < 0);

        const totalPnL = setupTrades.reduce(
          (sum, t) => sum + Number(t.pnl),
          0
        );

        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

        const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

        const averageWin =
          wins.length > 0
            ? wins.reduce((sum, t) => sum + Number(t.pnl), 0) / wins.length
            : 0;

        const averageLoss =
          losses.length > 0
            ? losses.reduce((sum, t) => sum + Number(t.pnl), 0) / losses.length
            : 0;

        return {
          setupName,
          totalTrades,
          winRate,
          totalPnL,
          averagePnL,
          averageWin,
          averageLoss,
        };
      })
      .sort((a, b) => b.totalPnL - a.totalPnL);
  }, [trades]);

    const mistakeAnalytics = useMemo(() => {
    const grouped: Record<string, Trade[]> = {};

    for (const trade of trades) {
      if (!trade.mistakes || trade.mistakes.length === 0) continue;

      for (const mistake of trade.mistakes) {
        if (!grouped[mistake]) {
          grouped[mistake] = [];
        }

        grouped[mistake].push(trade);
      }
    }

    return Object.entries(grouped)
      .map(([mistakeName, mistakeTrades]) => {
        const totalTrades = mistakeTrades.length;
        const wins = mistakeTrades.filter((t) => Number(t.pnl) > 0);
        const totalPnL = mistakeTrades.reduce(
          (sum, t) => sum + Number(t.pnl),
          0
        );
        const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

        return {
          mistakeName,
          totalTrades,
          totalPnL,
          averagePnL,
          winRate,
        };
      })
      .sort((a, b) => a.totalPnL - b.totalPnL);
  }, [trades]);

  const currentFocus = useMemo(() => {
    if (reviewCompletion.pending > 0) {
      return {
        title: "Clear pending reviews",
        description: `${reviewCompletion.pending} trade${
          reviewCompletion.pending === 1 ? "" : "s"
        } still need review.`,
        href: "/review",
        cta: "Open Review",
      };
    }

    if (hasMistakeAnalytics && mistakeAnalytics[0]) {
      return {
        title: `Tighten ${mistakeAnalytics[0].mistakeName}`,
        description: `This leak has produced ${mistakeAnalytics[0].totalPnL >= 0 ? "+" : ""}$${mistakeAnalytics[0].totalPnL.toFixed(2)} across ${mistakeAnalytics[0].totalTrades} tagged trades.`,
        href: "/mistakes",
        cta: "Inspect Mistakes",
      };
    }

    if (hasSetupAnalytics && setupAnalytics[0]) {
      return {
        title: `Lean into ${setupAnalytics[0].setupName}`,
        description: `Your best setup has produced ${setupAnalytics[0].totalPnL >= 0 ? "+" : ""}$${setupAnalytics[0].totalPnL.toFixed(2)} so far.`,
        href: "/setups",
        cta: "View Setups",
      };
    }

    return {
      title: "Log more trades",
      description: "The dashboard gets sharper as your trade sample grows.",
      href: "/trades",
      cta: "Go to Journal",
    };
  }, [
    hasMistakeAnalytics,
    hasSetupAnalytics,
    mistakeAnalytics,
    reviewCompletion.pending,
    setupAnalytics,
  ]);

  const toggleMistake = (mistake: string) => {
    setMistakes((prev) =>
      prev.includes(mistake)
        ? prev.filter((item) => item !== mistake)
        : [...prev, mistake]
    );
  };

      const editTrade = (trade: Trade) => {
    const tradeSetup = trade.setup || "";
    const isPresetSetup = setupOptions.includes(tradeSetup);

    setEditingTradeId(trade.id);
    setDate(trade.date);
    setTicker(trade.ticker);
    setSide(trade.side);
    setEntry(String(trade.entry));
    setExit(String(trade.exit));
    setShares(String(trade.shares));
    setSetup(tradeSetup);
    setSelectedSetup(isPresetSetup ? tradeSetup : tradeSetup ? "Other" : "");
    setCustomSetup(isPresetSetup ? "" : tradeSetup);
    setNotes(trade.notes || "");
    setAdherenceScore(
      trade.adherence_score ? String(trade.adherence_score) : ""
    );
    setConfidenceScore(
      trade.confidence_score ? String(trade.confidence_score) : ""
    );
    setEmotion(trade.emotion || "");
    setLessonLearned(trade.lesson_learned || "");
    setReviewCompleted(Boolean(trade.review_completed));
    setMistakes(trade.mistakes || []);
    setScreenshotFile(null);
    setExistingScreenshotUrl(trade.screenshot_url || "");
    setStatusMessage("");
  };

    const submitTrade = async () => {
    const entryNum = Number(entry);
    const exitNum = Number(exit);
    const sharesNum = Number(shares);
    const adherenceNum = adherenceScore ? Number(adherenceScore) : null;
    const confidenceNum = confidenceScore ? Number(confidenceScore) : null;
    const finalSetup =
      selectedSetup === "Other"
        ? customSetup.trim()
        : selectedSetup.trim();

    if (!date || !ticker || !entry || !exit || !shares) {
      setStatusMessage("Fill in date, ticker, entry, exit, and shares.");
      return;
    }

    if ([entryNum, exitNum, sharesNum].some((n) => Number.isNaN(n))) {
      setStatusMessage("Entry, exit, and shares must be valid numbers.");
      return;
    }

    if (
      [adherenceNum, confidenceNum].some(
        (n) => n !== null && (Number.isNaN(n) || n < 1 || n > 5)
      )
    ) {
      setStatusMessage("Review scores must be between 1 and 5.");
      return;
    }

    if (selectedSetup === "Other" && !customSetup.trim()) {
      setStatusMessage("Enter a custom setup name.");
      return;
    }

    try {
      setSaving(true);
      setStatusMessage("");

      let screenshotUrl = existingScreenshotUrl;

      if (screenshotFile) {
        const fileExt = screenshotFile.name.split(".").pop() || "png";
        const safeTicker = ticker.trim().toUpperCase() || "TRADE";
        const fileName = `${userId}/${Date.now()}-${safeTicker}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("trade-screenshot")
          .upload(fileName, screenshotFile, {
            upsert: false,
          });

        if (uploadError) {
          setStatusMessage(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("trade-screenshot")
          .getPublicUrl(fileName);

        screenshotUrl = publicUrlData.publicUrl;
      }

      const tradePayload = {
        user_id: userId,
        date,
        ticker: ticker.toUpperCase(),
        side,
        entry: entryNum,
        exit: exitNum,
        shares: sharesNum,
        setup: finalSetup,
        notes,
        mistakes,
        pnl: calculatePnL(entryNum, exitNum, sharesNum, side),
        adherence_score: adherenceNum,
        confidence_score: confidenceNum,
        emotion: emotion || null,
        lesson_learned: lessonLearned.trim() || null,
        review_completed: reviewCompleted,
        screenshot_url: screenshotUrl || null,
      };

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

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", userId);

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

  const exportToCSV = () => {
    if (!sortedTrades.length) {
      setStatusMessage("No trades to export.");
      return;
    }

    const headers = [
      "Date",
      "Ticker",
      "Side",
      "Entry",
      "Exit",
      "Shares",
      "Setup",
      "Mistakes",
      "Notes",
      "PnL",
    ];

    const rows = sortedTrades.map((trade) => [
      trade.date,
      trade.ticker,
      trade.side,
      trade.entry,
      trade.exit,
      trade.shares,
      trade.setup || "",
      trade.mistakes.join(" | "),
      trade.notes || "",
      trade.pnl,
    ]);

    const escapeCSVValue = (value: string | number) => {
      const stringValue = String(value ?? "");
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCSVValue).join(","),
      ...rows.map((row) => row.map(escapeCSVValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "trades-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setStatusMessage("CSV exported.");
  };

  const applySavedView = (savedView: SavedView) => {
    setTickerFilter(savedView.tickerFilter);
    setSetupFilter(savedView.setupFilter);
    setMistakeFilter(savedView.mistakeFilter);
    setStatusMessage(`Applied saved view: ${savedView.name}`);
  };

  const saveCurrentView = (name: string) => {
    const nextView: SavedView = {
      id: `${Date.now()}`,
      name: name.trim(),
      tickerFilter,
      setupFilter,
      mistakeFilter,
    };

    setSavedViews((prev) => [nextView, ...prev.filter((item) => item.name !== nextView.name)]);
    setStatusMessage(`Saved view: ${nextView.name}`);
  };

  const deleteSavedView = (id: string) => {
    setSavedViews((prev) => prev.filter((item) => item.id !== id));
  };

  const clearFilters = () => {
    setTickerFilter("");
    setSetupFilter("");
    setMistakeFilter("All");
    setStatusMessage("Filters cleared.");
  };

  const loadTradeTemplate = (trade: Trade) => {
    const tradeSetup = trade.setup || "";
    const isPresetSetup = setupOptions.includes(tradeSetup);

    setEditingTradeId(null);
    setDate(new Date().toISOString().slice(0, 10));
    setTicker(trade.ticker);
    setSide(trade.side);
    setEntry("");
    setExit("");
    setShares(String(trade.shares));
    setSetup(tradeSetup);
    setSelectedSetup(isPresetSetup ? tradeSetup : tradeSetup ? "Other" : "");
    setCustomSetup(isPresetSetup ? "" : tradeSetup);
    setNotes("");
    setAdherenceScore("");
    setConfidenceScore("");
    setEmotion("");
    setLessonLearned("");
    setReviewCompleted(false);
    setMistakes([]);
    setScreenshotFile(null);
    setExistingScreenshotUrl("");
    setStatusMessage(`Loaded template from ${trade.ticker}.`);
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
    sectionNav:
      theme === "dark"
        ? "mb-6 flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-[#111827]/60 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.20)] backdrop-blur"
        : "mb-6 flex flex-wrap gap-3 rounded-3xl border border-black/10 bg-white/95 p-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)]",
    sectionButton:
      theme === "dark"
        ? "flex min-w-[150px] flex-1 flex-col rounded-2xl border border-transparent bg-[#0b1220] px-4 py-3 text-left text-sm text-[#94a3b8] transition hover:border-white/10 hover:text-white"
        : "flex min-w-[150px] flex-1 flex-col rounded-2xl border border-transparent bg-[#f8fafc] px-4 py-3 text-left text-sm text-[#6b7280] transition hover:border-black/10 hover:text-[#111827]",
    sectionLink:
      theme === "dark"
        ? "rounded-2xl border border-white/10 bg-[#0b1220] p-4 transition hover:border-[#2962ff]/40"
        : "rounded-2xl border border-black/10 bg-[#f8fafc] p-4 transition hover:border-[#2962ff]/30",
    subtlePanel:
      theme === "dark"
        ? "rounded-3xl border border-white/10 bg-[#0b1220] p-5"
        : "rounded-3xl border border-black/10 bg-[#f8fafc] p-5",
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
              {pageTitle}
            </p>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Track trades like a professional
            </h1>

            <p className={`mt-2 max-w-2xl text-sm md:text-base ${styles.muted}`}>
              {pageDescription}
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
              className={`${
                theme === "light" ? styles.buttonPrimary : styles.buttonSecondary
              } min-w-[96px]`}
            >
              Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`${
                theme === "dark" ? styles.buttonPrimary : styles.buttonSecondary
              } min-w-[96px]`}
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

        {view === "workspace" && (
          <div className={styles.sectionNav}>
            {workspaceSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={styles.sectionButton}
              >
                <span className="text-sm font-semibold tracking-tight">
                  {section.label}
                </span>
                <span className="mt-1 text-xs leading-5 opacity-80">
                  {section.description}
                </span>
              </a>
            ))}
          </div>
        )}

        {visibleSections.overview && (
          <section id="overview" className="mb-6 scroll-mt-28 space-y-6">
          <div className={`${styles.card} p-6 md:p-7`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                >
                  Dashboard Overview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                  See performance, review quality, and the next best action fast
                </h2>
                <p className={`mt-3 max-w-2xl text-sm leading-7 ${styles.muted}`}>
                  Start here, understand how you are trading, and move directly
                  into the workflow that matters most. The dashboard now focuses
                  on performance, behavior, and what to do next.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <a href="/trades" className={styles.buttonPrimary}>
                  Go to Journal
                </a>
                <a href="/analytics" className={styles.buttonSecondary}>
                  Open Analytics
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <JournalStatCard
              label="Total P&L"
              value={`${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`}
              detail={`${trades.length} trades logged`}
              toneClassName={totalPnL >= 0 ? styles.positive : styles.negative}
              cardClassName={`${styles.card} p-5`}
              mutedClassName={styles.muted}
              valueClassName="text-3xl md:text-4xl"
            />

            <JournalStatCard
              label="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              detail={`This month ${monthPnL >= 0 ? "+" : ""}$${monthPnL.toFixed(2)}`}
              cardClassName={`${styles.card} p-5`}
              mutedClassName={styles.muted}
              valueClassName="text-3xl"
            />

            {hasAdvancedAnalytics ? (
              <JournalStatCard
                label="Profit Factor"
                value={profitFactor === Infinity ? "INF" : profitFactor.toFixed(2)}
                detail={`Drawdown -$${maxDrawdown.toFixed(2)}`}
                toneClassName={profitFactor >= 1 ? styles.positive : styles.negative}
                cardClassName={`${styles.card} p-5`}
                mutedClassName={styles.muted}
                valueClassName="text-3xl"
              />
            ) : (
              <div className={`${styles.card} p-5`}>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                >
                  Pro Insight
                </p>
                <p className="mt-3 text-2xl font-semibold">Profit Factor</p>
                <p className={`mt-2 text-sm ${styles.muted}`}>
                  Upgrade when you want deeper performance context.
                </p>
              </div>
            )}

            <JournalStatCard
              label="Review Coverage"
              value={`${reviewCompletion.rate.toFixed(0)}%`}
              detail={`${reviewCompletion.reviewed} reviewed / ${reviewCompletion.pending} pending`}
              cardClassName={`${styles.card} p-5`}
              mutedClassName={styles.muted}
              valueClassName="text-3xl"
            />

            <JournalStatCard
              label="Next Focus"
              value={reviewCompletion.pending > 0 ? "Review Backlog" : "Stay Consistent"}
              detail={currentFocus.description}
              cardClassName={`${styles.card} p-5`}
              mutedClassName={styles.muted}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className={`${styles.card} p-6`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    Recent Trades
                  </h3>
                  <p className={`mt-1 text-sm ${styles.muted}`}>
                    A quick read on your latest journal activity.
                  </p>
                </div>
                <a href="/trades#history" className={styles.buttonSecondary}>
                  Full History
                </a>
              </div>

              <div className="mt-5 space-y-3">
                {recentTrades.length === 0 ? (
                  <div className={styles.subtlePanel}>
                    <p className="text-lg font-semibold">No trades yet</p>
                    <p className={`mt-2 text-sm ${styles.muted}`}>
                      Start in the journal section to log your first trade.
                    </p>
                  </div>
                ) : (
                  recentTrades.map((trade) => (
                    <a
                      key={trade.id}
                      href="/trades#history"
                      onClick={() => setTickerFilter(trade.ticker)}
                      className={`${styles.sectionLink} flex items-start justify-between gap-4`}
                    >
                      <div>
                        <p className="text-sm font-semibold tracking-wide">
                          {trade.ticker} - {trade.side}
                        </p>
                        <p className={`mt-1 text-sm ${styles.muted}`}>
                          {trade.date} - {trade.setup || "No setup"}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          Number(trade.pnl) >= 0
                            ? styles.positive
                            : styles.negative
                        }`}
                      >
                        {Number(trade.pnl) >= 0 ? "+" : ""}$
                        {Number(trade.pnl).toFixed(2)}
                      </p>
                    </a>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${styles.card} p-6`}>
                <h3 className="text-xl font-semibold tracking-tight">
                  Today&apos;s Focus
                </h3>
                <div className="mt-5 rounded-3xl border border-[#2962ff]/20 bg-[#101a2f] p-5">
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                  >
                    Best Next Action
                  </p>
                  <p className="mt-3 text-xl font-semibold">{currentFocus.title}</p>
                  <p className={`mt-3 text-sm leading-7 ${styles.muted}`}>
                    {currentFocus.description}
                  </p>
                  <a href={currentFocus.href} className={`${styles.buttonPrimary} mt-5 inline-flex`}>
                    {currentFocus.cta}
                  </a>
                </div>
              </div>

              <div className={`${styles.card} p-6`}>
                <h3 className="text-xl font-semibold tracking-tight">
                  Edge Snapshot
                </h3>
                <div className="mt-5 grid gap-3">
                  <a href="/setups" className={styles.sectionLink}>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                    >
                      Best Setup
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {setupAnalytics[0]?.setupName || "No setup data"}
                    </p>
                    <p className={`mt-1 text-sm ${styles.muted}`}>
                      {setupAnalytics[0]
                        ? `${setupAnalytics[0].totalTrades} trades · ${
                            setupAnalytics[0].totalPnL >= 0 ? "+" : ""
                          }$${setupAnalytics[0].totalPnL.toFixed(2)} total`
                        : "Add more trades to compare setups."}
                    </p>
                  </a>

                  <a href="/mistakes" className={styles.sectionLink}>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                    >
                      Biggest Leak
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {mistakeAnalytics[0]?.mistakeName || "No mistake data"}
                    </p>
                    <p className={`mt-1 text-sm ${styles.muted}`}>
                      {mistakeAnalytics[0]
                        ? `${mistakeAnalytics[0].totalTrades} trades · ${
                            mistakeAnalytics[0].totalPnL >= 0 ? "+" : ""
                          }$${mistakeAnalytics[0].totalPnL.toFixed(2)} total`
                        : "Tag mistakes to surface psychology patterns."}
                    </p>
                  </a>
                </div>
              </div>

              <div className={`${styles.card} p-6`}>
                <h3 className="text-xl font-semibold tracking-tight">
                  Account
                </h3>
                <div className="mt-5 grid gap-3">
                  <div className={styles.subtlePanel}>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                    >
                      Signed In
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {userEmail || "No email available"}
                    </p>
                  </div>
                  <div className={styles.subtlePanel}>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                    >
                      Active Filters
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {[
                        tickerFilter,
                        setupFilter,
                        mistakeFilter !== "All" ? mistakeFilter : "",
                      ].filter(Boolean).length || 0}{" "}
                      applied
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </section>
        )}

        <div
          className={`grid gap-6 ${
            visibleSections.journal && (visibleSections.analytics || visibleSections.setups || visibleSections.mistakes || visibleSections.history)
              ? "xl:grid-cols-[420px_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {(visibleSections.journal || visibleSections.analytics) && (
            <div className="space-y-6">
            {visibleSections.journal && (
              <TradeFormSection
                cardClassName={styles.card}
                inputClassName={styles.input}
                textareaClassName={styles.textarea}
                mutedClassName={styles.muted}
                buttonPrimaryClassName={styles.buttonPrimary}
                buttonSecondaryClassName={styles.buttonSecondary}
                pillClassName={styles.pill}
                pillActiveClassName={styles.pillActive}
                positiveClassName={styles.positive}
                negativeClassName={styles.negative}
                subtlePanelClassName={
                  theme === "dark"
                    ? "rounded-3xl border border-white/10 bg-[#0b1220] p-5"
                    : "rounded-3xl border border-black/10 bg-[#f8fafc] p-5"
                }
                statusMessage={statusMessage}
                editingTradeId={editingTradeId}
                date={date}
                ticker={ticker}
                side={side}
                entry={entry}
                exit={exit}
                shares={shares}
                selectedSetup={selectedSetup}
                customSetup={customSetup}
                notes={notes}
                adherenceScore={adherenceScore}
                confidenceScore={confidenceScore}
                emotion={emotion}
                lessonLearned={lessonLearned}
                reviewCompleted={reviewCompleted}
                screenshotFile={screenshotFile}
                existingScreenshotUrl={existingScreenshotUrl}
                mistakes={mistakes}
                livePnL={livePnL}
                latestTradeLabel={latestTradeTemplate?.ticker ?? null}
                setupOptions={setupOptions}
                mistakeOptions={mistakeOptions}
                saving={saving}
                setDate={setDate}
                setTicker={setTicker}
                setSide={setSide}
                setEntry={setEntry}
                setExit={setExit}
                setShares={setShares}
                setSelectedSetup={setSelectedSetup}
                setCustomSetup={setCustomSetup}
                setNotes={setNotes}
                setAdherenceScore={setAdherenceScore}
                setConfidenceScore={setConfidenceScore}
                setEmotion={setEmotion}
                setLessonLearned={setLessonLearned}
                setReviewCompleted={setReviewCompleted}
                setScreenshotFile={setScreenshotFile}
                toggleMistake={toggleMistake}
                submitTrade={submitTrade}
                resetForm={resetForm}
                useLatestTradeTemplate={() => {
                  if (latestTradeTemplate) {
                    loadTradeTemplate(latestTradeTemplate);
                  }
                }}
              />
            )}

            {visibleSections.analytics && (
              <section
                id="analytics"
                className="grid scroll-mt-28 gap-4 md:grid-cols-3 xl:grid-cols-2"
              >
                <AnalyticsMetricsGrid
                  cardClassName={`${styles.card} p-5`}
                  mutedClassName={styles.muted}
                  positiveClassName={styles.positive}
                  negativeClassName={styles.negative}
                  totalPnL={totalPnL}
                  winRate={winRate}
                  averagePnL={averagePnL}
                  averageWin={averageWin}
                  averageLoss={averageLoss}
                  largestWin={largestWin}
                  largestLoss={largestLoss}
                  profitFactor={profitFactor}
                  expectancy={expectancy}
                  maxDrawdown={maxDrawdown}
                  showAdvancedMetrics={hasAdvancedAnalytics}
                />
                {!hasAdvancedAnalytics ? (
                  <div className="md:col-span-3 xl:col-span-2">
                    <FeatureLockCard
                      feature="advancedAnalytics"
                      currentPlan={subscriptionPlan}
                    />
                  </div>
                ) : null}
              </section>
            )}
          </div>
          )}

          {(visibleSections.setups ||
            visibleSections.mistakes ||
            visibleSections.history ||
            visibleSections.analytics) && (
            <div className="space-y-6">{visibleSections.setups && (
              <section
                id="setups"
                className={`${styles.card} scroll-mt-28 overflow-hidden`}
              >
              <div
                className={
                  theme === "dark"
                    ? "border-b border-white/10 px-6 py-5"
                    : "border-b border-black/10 px-6 py-5"
                }
              >
                <JournalSectionHeader
                  title="Setup Analytics"
                  description="Click a setup row to filter your journal by that setup."
                  mutedClassName={styles.muted}
                  actions={
                    setupFilter ? (
                      <button
                        type="button"
                        onClick={() => setSetupFilter("")}
                        className={styles.buttonSecondary}
                      >
                        Clear Setup Filter
                      </button>
                    ) : null
                  }
                />
              </div>

              {!hasSetupAnalytics ? (
                <div className="p-6">
                  <FeatureLockCard
                    feature="setupAnalytics"
                    currentPlan={subscriptionPlan}
                  />
                </div>
              ) : setupAnalytics.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center px-6 py-10">
                  <p className={styles.muted}>No setup data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className={theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Setup
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Trades
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Win Rate
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Total P&amp;L
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Avg P&amp;L
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Avg Win
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Avg Loss
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {setupAnalytics.map((s) => {
                        const isActive =
                          (s.setupName === "No Setup" &&
                            setupFilter === "No Setup") ||
                          s.setupName.toLowerCase() ===
                            setupFilter.toLowerCase();

                        return (
                          <tr
                            key={s.setupName}
                            className={`${styles.row} cursor-pointer transition ${
                              isActive
                                ? theme === "dark"
                                  ? "bg-[#2962ff]/10"
                                  : "bg-[#2962ff]/8"
                                : ""
                            }`}
                            onClick={() =>
                              setSetupFilter(
                                s.setupName === "No Setup"
                                  ? "No Setup"
                                  : s.setupName
                              )
                            }
                          >
                            <td className="px-6 py-4 font-semibold">
                              {s.setupName}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {s.totalTrades}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {s.winRate.toFixed(1)}%
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${
                                s.totalPnL >= 0
                                  ? styles.positive
                                  : styles.negative
                              }`}
                            >
                              {s.totalPnL >= 0 ? "+" : ""}$
                              {s.totalPnL.toFixed(2)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${
                                s.averagePnL >= 0
                                  ? styles.positive
                                  : styles.negative
                              }`}
                            >
                              {s.averagePnL >= 0 ? "+" : ""}$
                              {s.averagePnL.toFixed(2)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${styles.positive}`}
                            >
                              +${s.averageWin.toFixed(2)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${styles.negative}`}
                            >
                              ${s.averageLoss.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </section>
            )}

            {visibleSections.mistakes && (
              <section
                id="mistakes"
                className={`${styles.card} scroll-mt-28 overflow-hidden`}
              >
              <div
                className={
                  theme === "dark"
                    ? "border-b border-white/10 px-6 py-5"
                    : "border-b border-black/10 px-6 py-5"
                }
              >
                <JournalSectionHeader
                  title="Mistake Analytics"
                  description="Click a mistake row to filter trades by that mistake."
                  mutedClassName={styles.muted}
                  actions={
                    mistakeFilter !== "All" ? (
                      <button
                        type="button"
                        onClick={() => setMistakeFilter("All")}
                        className={styles.buttonSecondary}
                      >
                        Clear Mistake Filter
                      </button>
                    ) : null
                  }
                />
              </div>

              {!hasMistakeAnalytics ? (
                <div className="p-6">
                  <FeatureLockCard
                    feature="mistakeAnalytics"
                    currentPlan={subscriptionPlan}
                  />
                </div>
              ) : mistakeAnalytics.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center px-6 py-10">
                  <p className={styles.muted}>No mistake data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className={theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Mistake
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Trades
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Win Rate
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Total P&amp;L
                        </th>
                        <th
                          className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${styles.tableHead}`}
                        >
                          Avg P&amp;L
                        </th>
                      </tr>
                    </thead>
                    <tbody>

                      {mistakeAnalytics.map((m) => {
                        const isActive = mistakeFilter === m.mistakeName;

                        return (
                          <tr
                            key={m.mistakeName}
                            className={`${styles.row} cursor-pointer transition ${
                              isActive
                                ? theme === "dark"
                                  ? "bg-[#ff4d4f]/10"
                                  : "bg-[#ff4d4f]/8"
                                : ""
                            }`}
                            onClick={() => setMistakeFilter(m.mistakeName)}
                          >
                            <td className="px-6 py-4 font-semibold">
                              {m.mistakeName}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {m.totalTrades}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {m.winRate.toFixed(1)}%
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${
                                m.totalPnL >= 0 ? styles.positive : styles.negative
                              }`}
                            >
                              {m.totalPnL >= 0 ? "+" : ""}${m.totalPnL.toFixed(2)}
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-semibold ${
                                m.averagePnL >= 0 ? styles.positive : styles.negative
                              }`}
                            >
                              {m.averagePnL >= 0 ? "+" : ""}${m.averagePnL.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </section>
            )}

            {visibleSections.history && (
              <TradeHistorySection
                cardClassName={styles.card}
                mutedClassName={styles.muted}
                inputClassName={styles.input}
                buttonSecondaryClassName={styles.buttonSecondary}
                buttonDangerClassName={styles.buttonDanger}
                rowClassName={styles.row}
                tableHeadClassName={styles.tableHead}
                positiveClassName={styles.positive}
                negativeClassName={styles.negative}
                theme={theme}
                trades={trades}
                sortedTrades={sortedTrades}
                filteredTotalPnL={filteredTotalPnL}
                filteredWinRate={filteredWinRate}
                tickerFilter={tickerFilter}
                setupFilter={setupFilter}
                mistakeFilter={mistakeFilter}
                mistakeOptions={mistakeOptions}
                savedViews={savedViews}
                getSortIndicator={getSortIndicator}
                handleSort={handleSort}
                setTickerFilter={setTickerFilter}
                setSetupFilter={setSetupFilter}
                setMistakeFilter={setMistakeFilter}
                exportToCSV={exportToCSV}
                clearAllTrades={clearAllTrades}
                clearFilters={clearFilters}
                saveCurrentView={saveCurrentView}
                applySavedView={(id) => {
                  const savedView = savedViews.find((item) => item.id === id);
                  if (savedView) applySavedView(savedView);
                }}
                deleteSavedView={deleteSavedView}
                editTrade={editTrade}
                duplicateTrade={loadTradeTemplate}
                deleteTrade={deleteTrade}
              />
            )}

            {visibleSections.analytics && hasAdvancedAnalytics && (
            <div className={`${styles.card} p-6`}>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Performance Curve
                  </h2>
                  <p className={`mt-1 text-sm ${styles.muted}`}>
                    Cumulative P&amp;L for the trades currently shown by your
                    filters.
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                  >
                    Filtered Equity
                  </p>
                  <p
                    className={`mt-1 text-xl font-semibold ${
                      filteredTotalPnL >= 0
                        ? styles.positive
                        : styles.negative
                    }`}
                  >
                    {filteredTotalPnL >= 0 ? "+" : ""}$
                    {filteredTotalPnL.toFixed(2)}
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
                    <p className="text-lg font-semibold">
                      No performance data yet
                    </p>
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
                    <span className={styles.muted}>
                      Min ${chartStats.min.toFixed(2)}
                    </span>
                    <span className={styles.muted}>
                      Max ${chartStats.max.toFixed(2)}
                    </span>
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
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                      >
                        Trades Shown
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {filteredTrades.length}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                      >
                        Best Run
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${styles.positive}`}
                      >
                        ${chartStats.max.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.muted}`}
                      >
                        Worst Drawdown Point
                      </p>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          chartStats.min < 0
                            ? styles.negative
                            : styles.muted
                        }`}
                      >
                        ${chartStats.min.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}




