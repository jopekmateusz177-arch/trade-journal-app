"use client";

import { useMemo, useState } from "react";
import { hasFeatureAccess } from "../../../lib/billing/access";
import type { SubscriptionPlan } from "../../../lib/billing/plans";
import { FeatureLockCard } from "../../components/feature-lock-card";
import type { Trade } from "../types";

type TradeReviewCalendarProps = {
  trades: Trade[];
  subscriptionPlan: SubscriptionPlan;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStartOfWeek(date: Date) {
  const clone = new Date(date);
  const day = clone.getDay();
  clone.setDate(clone.getDate() - day);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

export function TradeReviewCalendar({
  trades,
  subscriptionPlan,
}: TradeReviewCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    trades[0]?.date ?? null
  );
  const hasReviewInsights = hasFeatureAccess(subscriptionPlan, "reviewInsights");

  const daySummaries = useMemo(() => {
    return trades.reduce<Record<string, { count: number; pnl: number }>>((acc, trade) => {
      const key = trade.date;
      if (!acc[key]) {
        acc[key] = { count: 0, pnl: 0 };
      }
      acc[key].count += 1;
      acc[key].pnl += Number(trade.pnl);
      return acc;
    }, {});
  }, [trades]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const selectedTrades = useMemo(() => {
    if (!selectedDateKey) return [];
    return trades.filter((trade) => trade.date === selectedDateKey);
  }, [selectedDateKey, trades]);

  const weeklySummary = useMemo(() => {
    if (!selectedDateKey) return null;
    const selectedDate = new Date(`${selectedDateKey}T00:00:00`);
    const weekStart = getStartOfWeek(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekTrades = trades.filter((trade) => {
      const tradeDate = new Date(`${trade.date}T00:00:00`);
      return tradeDate >= weekStart && tradeDate <= weekEnd;
    });

    return {
      start: formatDateKey(weekStart),
      end: formatDateKey(weekEnd),
      count: weekTrades.length,
      pnl: weekTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0),
      reviewedCount: weekTrades.filter((trade) => trade.review_completed).length,
    };
  }, [selectedDateKey, trades]);

  const reviewSummary = useMemo(() => {
    const reviewedTrades = trades.filter((trade) => trade.review_completed);
    const adherenceValues = reviewedTrades
      .map((trade) => trade.adherence_score)
      .filter((value): value is number => typeof value === "number");
    const confidenceValues = reviewedTrades
      .map((trade) => trade.confidence_score)
      .filter((value): value is number => typeof value === "number");

    const emotions = reviewedTrades.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.emotion?.trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const emotionPnL = reviewedTrades.reduce<
      Record<string, { count: number; pnl: number }>
    >((acc, trade) => {
      const key = trade.emotion?.trim();
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = { count: 0, pnl: 0 };
      }
      acc[key].count += 1;
      acc[key].pnl += Number(trade.pnl);
      return acc;
    }, {});

    const lowAdherenceTrades = reviewedTrades.filter(
      (trade) =>
        typeof trade.adherence_score === "number" && trade.adherence_score <= 2
    );

    const reviewedTradeDates = [...new Set(reviewedTrades.map((trade) => trade.date))].sort(
      (a, b) => (a < b ? 1 : -1)
    );

    let reviewStreak = 0;
    if (reviewedTradeDates.length > 0) {
      const cursor = new Date(`${reviewedTradeDates[0]}T00:00:00`);
      for (const dateKey of reviewedTradeDates) {
        const compare = new Date(`${dateKey}T00:00:00`);
        if (formatDateKey(compare) !== formatDateKey(cursor)) {
          break;
        }
        reviewStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    const bestEmotionEntry = Object.entries(emotionPnL)
      .map(([emotion, summary]) => ({
        emotion,
        averagePnL: summary.pnl / summary.count,
        count: summary.count,
      }))
      .sort((a, b) => b.averagePnL - a.averagePnL)[0];

    return {
      reviewedCount: reviewedTrades.length,
      reviewRate: trades.length ? (reviewedTrades.length / trades.length) * 100 : 0,
      adherenceAverage: adherenceValues.length
        ? adherenceValues.reduce((sum, value) => sum + value, 0) / adherenceValues.length
        : 0,
      confidenceAverage: confidenceValues.length
        ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
        : 0,
      lowAdherenceLossRate: lowAdherenceTrades.length
        ? (lowAdherenceTrades.filter((trade) => Number(trade.pnl) < 0).length /
            lowAdherenceTrades.length) *
          100
        : 0,
      reviewStreak,
      bestEmotionEntry,
      topEmotions: Object.entries(emotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    };
  }, [trades]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8ea2c9]">
          Review Center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Daily and weekly trade review
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#94a3b8]">
          Use the calendar to spot clusters of activity, then drill into a day to
          review trade quality, psychology, and lessons learned.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
            Trades Reviewed
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {reviewSummary.reviewedCount} / {trades.length}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
            Review Rate
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {reviewSummary.reviewRate.toFixed(1)}%
          </p>
        </div>
        {hasReviewInsights ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Avg Adherence
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {reviewSummary.adherenceAverage.toFixed(1)} / 5
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Avg Confidence
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {reviewSummary.confidenceAverage.toFixed(1)} / 5
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Review Streak
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {reviewSummary.reviewStreak} days
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Low-Adherence Loss Rate
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {reviewSummary.lowAdherenceLossRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#131c31] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                Best Emotional State
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {reviewSummary.bestEmotionEntry?.emotion || "Not enough data"}
              </p>
              <p className="mt-2 text-sm text-[#94a3b8]">
                {reviewSummary.bestEmotionEntry
                  ? `${reviewSummary.bestEmotionEntry.count} reviewed trades - ${
                      reviewSummary.bestEmotionEntry.averagePnL >= 0 ? "+" : ""
                    }$${reviewSummary.bestEmotionEntry.averagePnL.toFixed(2)} avg P&L`
                  : "Complete more trade reviews to surface this signal."}
              </p>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Calendar
              </h2>
              <p className="mt-1 text-sm text-[#94a3b8]">
                Click a day to inspect trades and review quality.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white"
              >
                Prev
              </button>
              <p className="min-w-[140px] text-center text-sm font-semibold text-white">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
                className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-white"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const key = formatDateKey(day);
              const summary = daySummaries[key];
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDateKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDateKey(key)}
                  className={`min-h-[92px] rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#2962ff]/50 bg-[#13203a]"
                      : "border-white/10 bg-[#0b1220] hover:border-[#2962ff]/30"
                  } ${isCurrentMonth ? "text-white" : "text-[#64748b]"}`}
                >
                  <p className="text-sm font-semibold">{day.getDate()}</p>
                  <p className="mt-2 text-xs text-[#8ea2c9]">
                    {summary ? `${summary.count} trades` : "No trades"}
                  </p>
                  {summary && (
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        summary.pnl >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                      }`}
                    >
                      {summary.pnl >= 0 ? "+" : ""}${summary.pnl.toFixed(2)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Selected Day
            </h2>
            {selectedDateKey ? (
              <>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  {formatDisplayDate(selectedDateKey)}
                </p>
                <div className="mt-5 space-y-3">
                  {selectedTrades.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4 text-sm text-[#94a3b8]">
                      No trades logged on this date.
                    </div>
                  ) : (
                    selectedTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="rounded-2xl border border-white/10 bg-[#0b1220] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">
                            {trade.ticker} - {trade.side}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              Number(trade.pnl) >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                            }`}
                          >
                            {Number(trade.pnl) >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-[#cbd5e1]">
                          <p>
                            Review: {trade.review_completed ? "Completed" : "Pending"}
                          </p>
                          <p>
                            Adherence: {trade.adherence_score ?? "--"} / Confidence:{" "}
                            {trade.confidence_score ?? "--"}
                          </p>
                          <p>Emotion: {trade.emotion || "--"}</p>
                          <p>Lesson: {trade.lesson_learned || "--"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#94a3b8]">
                Select a date to inspect trades.
              </p>
            )}
          </div>

          {hasReviewInsights ? (
            <>
              <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Weekly Summary
                </h2>
                {weeklySummary ? (
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                        Range
                      </p>
                      <p className="mt-2 text-sm text-white">
                        {formatDisplayDate(weeklySummary.start)} to{" "}
                        {formatDisplayDate(weeklySummary.end)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                        Trades
                      </p>
                      <p className="mt-2 text-sm text-white">{weeklySummary.count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                        Weekly P&amp;L
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          weeklySummary.pnl >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                        }`}
                      >
                        {weeklySummary.pnl >= 0 ? "+" : ""}${weeklySummary.pnl.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea2c9]">
                        Reviewed Trades
                      </p>
                      <p className="mt-2 text-sm text-white">{weeklySummary.reviewedCount}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#94a3b8]">
                    Select a date to view the weekly summary.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#131c31] p-6">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Emotion Breakdown
                </h2>
                <div className="mt-5 grid gap-3">
                  {reviewSummary.topEmotions.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4 text-sm text-[#94a3b8]">
                      No review emotions recorded yet.
                    </div>
                  ) : (
                    reviewSummary.topEmotions.map(([emotion, count]) => (
                      <div
                        key={emotion}
                        className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white"
                      >
                        {emotion}: {count}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <FeatureLockCard feature="reviewInsights" currentPlan={subscriptionPlan} />
          )}
        </section>
      </div>
    </div>
  );
}

