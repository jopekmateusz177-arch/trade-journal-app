import { JournalStatCard } from "./journal-stat-card";

type AnalyticsMetricsGridProps = {
  cardClassName: string;
  mutedClassName: string;
  positiveClassName: string;
  negativeClassName: string;
  totalPnL: number;
  winRate: number;
  averagePnL: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  showAdvancedMetrics?: boolean;
};

export function AnalyticsMetricsGrid({
  cardClassName,
  mutedClassName,
  positiveClassName,
  negativeClassName,
  totalPnL,
  winRate,
  averagePnL,
  averageWin,
  averageLoss,
  largestWin,
  largestLoss,
  profitFactor,
  expectancy,
  maxDrawdown,
  showAdvancedMetrics = true,
}: AnalyticsMetricsGridProps) {
  return (
    <>
      <JournalStatCard
        label="Total P&L"
        value={`${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`}
        toneClassName={totalPnL >= 0 ? positiveClassName : negativeClassName}
        cardClassName={cardClassName}
        mutedClassName={mutedClassName}
      />
      <JournalStatCard
        label="Win Rate"
        value={`${winRate.toFixed(1)}%`}
        cardClassName={cardClassName}
        mutedClassName={mutedClassName}
      />
      <JournalStatCard
        label="Average P&L"
        value={`${averagePnL >= 0 ? "+" : ""}$${averagePnL.toFixed(2)}`}
        toneClassName={averagePnL >= 0 ? positiveClassName : negativeClassName}
        cardClassName={cardClassName}
        mutedClassName={mutedClassName}
      />
      <JournalStatCard
        label="Average Win"
        value={`+$${averageWin.toFixed(2)}`}
        toneClassName={positiveClassName}
        cardClassName={cardClassName}
        mutedClassName={mutedClassName}
      />
      <JournalStatCard
        label="Average Loss"
        value={`$${averageLoss.toFixed(2)}`}
        toneClassName={negativeClassName}
        cardClassName={cardClassName}
        mutedClassName={mutedClassName}
      />
      {showAdvancedMetrics ? (
        <>
          <JournalStatCard
            label="Largest Win"
            value={`+$${largestWin.toFixed(2)}`}
            toneClassName={positiveClassName}
            cardClassName={cardClassName}
            mutedClassName={mutedClassName}
          />
          <JournalStatCard
            label="Largest Loss"
            value={`$${largestLoss.toFixed(2)}`}
            toneClassName={negativeClassName}
            cardClassName={cardClassName}
            mutedClassName={mutedClassName}
          />
          <JournalStatCard
            label="Profit Factor"
            value={profitFactor === Infinity ? "INF" : profitFactor.toFixed(2)}
            toneClassName={profitFactor >= 1 ? positiveClassName : negativeClassName}
            cardClassName={cardClassName}
            mutedClassName={mutedClassName}
          />
          <JournalStatCard
            label="Expectancy"
            value={`${expectancy >= 0 ? "+" : ""}$${expectancy.toFixed(2)}`}
            toneClassName={expectancy >= 0 ? positiveClassName : negativeClassName}
            cardClassName={cardClassName}
            mutedClassName={mutedClassName}
          />
          <JournalStatCard
            label="Max Drawdown"
            value={`-$${maxDrawdown.toFixed(2)}`}
            toneClassName={negativeClassName}
            cardClassName={cardClassName}
            mutedClassName={mutedClassName}
          />
        </>
      ) : null}
    </>
  );
}
