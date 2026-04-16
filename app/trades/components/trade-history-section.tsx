"use client";

import { useState } from "react";
import { TradeScreenshot } from "./trade-screenshot";
import type { SortField, Trade } from "../types";

type TradeHistorySectionProps = {
  cardClassName: string;
  mutedClassName: string;
  inputClassName: string;
  buttonSecondaryClassName: string;
  buttonDangerClassName: string;
  rowClassName: string;
  tableHeadClassName: string;
  positiveClassName: string;
  negativeClassName: string;
  theme: "light" | "dark";
  trades: Trade[];
  sortedTrades: Trade[];
  filteredTotalPnL: number;
  filteredWinRate: number;
  tickerFilter: string;
  setupFilter: string;
  mistakeFilter: string;
  mistakeOptions: string[];
  savedViews: Array<{
    id: string;
    name: string;
    tickerFilter: string;
    setupFilter: string;
    mistakeFilter: string;
  }>;
  getSortIndicator: (field: SortField) => string;
  handleSort: (field: SortField) => void;
  setTickerFilter: (value: string) => void;
  setSetupFilter: (value: string) => void;
  setMistakeFilter: (value: string) => void;
  exportToCSV: () => void;
  clearAllTrades: () => void;
  clearFilters: () => void;
  saveCurrentView: (name: string) => void;
  applySavedView: (id: string) => void;
  deleteSavedView: (id: string) => void;
  editTrade: (trade: Trade) => void;
  duplicateTrade: (trade: Trade) => void;
  deleteTrade: (id: number) => void;
};

export function TradeHistorySection(props: TradeHistorySectionProps) {
  const {
    cardClassName,
    mutedClassName,
    inputClassName,
    buttonSecondaryClassName,
    buttonDangerClassName,
    rowClassName,
    tableHeadClassName,
    positiveClassName,
    negativeClassName,
    theme,
    trades,
    sortedTrades,
    filteredTotalPnL,
    filteredWinRate,
    tickerFilter,
    setupFilter,
    mistakeFilter,
    mistakeOptions,
    savedViews,
    getSortIndicator,
    handleSort,
    setTickerFilter,
    setSetupFilter,
    setMistakeFilter,
    exportToCSV,
    clearAllTrades,
    clearFilters,
    saveCurrentView,
    applySavedView,
    deleteSavedView,
    editTrade,
    duplicateTrade,
    deleteTrade,
  } = props;

  const hasActiveFilters =
    tickerFilter.trim().length > 0 ||
    setupFilter.trim().length > 0 ||
    mistakeFilter !== "All";
  const [saveViewName, setSaveViewName] = useState("");

  const handleSaveView = () => {
    const nextName = saveViewName.trim();

    if (!nextName) {
      return;
    }

    saveCurrentView(nextName);
    setSaveViewName("");
  };

  return (
    <section id="history" className={`${cardClassName} scroll-mt-28 overflow-hidden`}>
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
            <p className={`mt-1 text-sm ${mutedClassName}`}>
              Review each execution first, then judge the performance curve.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={
                theme === "dark"
                  ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-2 text-sm text-[#94a3b8]"
                  : "rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-2 text-sm text-[#6b7280]"
              }
            >
              {sortedTrades.length} shown / {trades.length} total
            </div>

            <button onClick={exportToCSV} className={buttonSecondaryClassName}>
              Export CSV
            </button>

            {hasActiveFilters ? (
              <button onClick={clearFilters} className={buttonSecondaryClassName}>
                Clear Filters
              </button>
            ) : null}

            <button onClick={clearAllTrades} className={buttonDangerClassName}>
              Clear All Trades
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div
            className={
              theme === "dark"
                ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
                : "rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-3"
            }
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>
              Filtered P&amp;L
            </p>
            <p className={`mt-2 text-lg font-semibold ${filteredTotalPnL >= 0 ? positiveClassName : negativeClassName}`}>
              {filteredTotalPnL >= 0 ? "+" : ""}${filteredTotalPnL.toFixed(2)}
            </p>
          </div>
          <div
            className={
              theme === "dark"
                ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
                : "rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-3"
            }
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>
              Filtered Win Rate
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {filteredWinRate.toFixed(1)}%
            </p>
          </div>
          <div
            className={
              theme === "dark"
                ? "rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3"
                : "rounded-2xl border border-black/10 bg-[#f8fafc] px-4 py-3"
            }
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>
              Active View
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {hasActiveFilters ? "Filtered" : "All trades"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <input
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            placeholder="Filter by ticker"
            className={inputClassName}
          />
          <input
            value={setupFilter}
            onChange={(e) => setSetupFilter(e.target.value)}
            placeholder="Filter by setup"
            className={inputClassName}
          />
          <select
            value={mistakeFilter}
            onChange={(e) => setMistakeFilter(e.target.value)}
            className={inputClassName}
          >
            <option value="All">All mistake tags</option>
            {mistakeOptions.map((mistake) => (
              <option key={mistake} value={mistake}>
                {mistake}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={saveViewName}
            onChange={(e) => setSaveViewName(e.target.value)}
            placeholder="Name this view"
            className={inputClassName}
          />
          <button
            type="button"
            onClick={handleSaveView}
            disabled={!saveViewName.trim()}
            className={buttonSecondaryClassName}
          >
            Save View
          </button>
        </div>

        {savedViews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedViews.map((savedView) => (
              <div
                key={savedView.id}
                className={
                  theme === "dark"
                    ? "flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1220] px-3 py-2"
                    : "flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2"
                }
              >
                <button
                  type="button"
                  onClick={() => applySavedView(savedView.id)}
                  className="text-xs font-semibold text-[#2962ff]"
                >
                  {savedView.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSavedView(savedView.id)}
                  className="text-xs text-[#94a3b8]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sortedTrades.length === 0 ? (
        <div className="flex min-h-[420px] items-center justify-center px-6 py-10">
          <div className="text-center">
            <p className="text-xl font-semibold tracking-tight">No matching trades</p>
            <p className={`mt-2 text-sm ${mutedClassName}`}>
              Adjust your filters or add a new trade.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead>
              <tr className={theme === "dark" ? "bg-[#0f172a]" : "bg-[#f8fafc]"}>
                {[
                  ["date", "Date"],
                  ["ticker", "Ticker"],
                  ["side", "Side"],
                  ["entry", "Entry"],
                  ["exit", "Exit"],
                  ["shares", "Shares"],
                  ["setup", "Setup"],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(field as SortField)}
                      className="flex items-center gap-2"
                    >
                      {label} <span>{getSortIndicator(field as SortField)}</span>
                    </button>
                  </th>
                ))}
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>Mistakes</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>Notes</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>Review</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>Screenshot</th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>
                  <button type="button" onClick={() => handleSort("pnl")} className="flex items-center gap-2">
                    P&amp;L <span>{getSortIndicator("pnl")}</span>
                  </button>
                </th>
                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] ${tableHeadClassName}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade) => (
                <tr key={trade.id} className={rowClassName}>
                  <td className="px-6 py-4 text-sm font-medium">{trade.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold tracking-wide">{trade.ticker}</td>
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
                  <td className="px-6 py-4 text-sm">{trade.setup || "--"}</td>
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
                        <span className={mutedClassName}>--</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="max-w-[240px] whitespace-pre-wrap break-words leading-6">
                      {trade.notes || "--"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={
                        trade.review_completed
                          ? "rounded-full border border-[#00c076]/20 bg-[#00c076]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#00c076]"
                          : "rounded-full border border-white/10 bg-[#0b1220] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]"
                      }
                    >
                      {trade.review_completed ? "Reviewed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {trade.screenshot_url ? (
                      <a href={trade.screenshot_url} target="_blank" rel="noreferrer" className="block">
                        <TradeScreenshot
                          src={trade.screenshot_url}
                          alt="Trade screenshot"
                          wrapperClassName="relative h-16 w-24 overflow-hidden rounded-xl border border-white/10"
                          className="object-cover"
                        />
                      </a>
                    ) : (
                      <span className={mutedClassName}>--</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold ${Number(trade.pnl) >= 0 ? positiveClassName : negativeClassName}`}>
                    {Number(trade.pnl) >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => duplicateTrade(trade)} className={buttonSecondaryClassName}>Reuse</button>
                      <button onClick={() => editTrade(trade)} className={buttonSecondaryClassName}>Edit</button>
                      <button onClick={() => deleteTrade(trade.id)} className={buttonDangerClassName}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
