"use client";

import { TradeScreenshot } from "./trade-screenshot";

type TradeFormSectionProps = {
  cardClassName: string;
  inputClassName: string;
  textareaClassName: string;
  mutedClassName: string;
  buttonPrimaryClassName: string;
  buttonSecondaryClassName: string;
  pillClassName: string;
  pillActiveClassName: string;
  positiveClassName: string;
  negativeClassName: string;
  subtlePanelClassName: string;
  statusMessage: string;
  editingTradeId: number | null;
  date: string;
  ticker: string;
  side: "Long" | "Short";
  entry: string;
  exit: string;
  shares: string;
  selectedSetup: string;
  customSetup: string;
  notes: string;
  adherenceScore: string;
  confidenceScore: string;
  emotion: string;
  lessonLearned: string;
  reviewCompleted: boolean;
  screenshotFile: File | null;
  existingScreenshotUrl: string;
  mistakes: string[];
  livePnL: number;
  latestTradeLabel: string | null;
  setupOptions: string[];
  mistakeOptions: string[];
  saving: boolean;
  setDate: (value: string) => void;
  setTicker: (value: string) => void;
  setSide: (value: "Long" | "Short") => void;
  setEntry: (value: string) => void;
  setExit: (value: string) => void;
  setShares: (value: string) => void;
  setSelectedSetup: (value: string) => void;
  setCustomSetup: (value: string) => void;
  setNotes: (value: string) => void;
  setAdherenceScore: (value: string) => void;
  setConfidenceScore: (value: string) => void;
  setEmotion: (value: string) => void;
  setLessonLearned: (value: string) => void;
  setReviewCompleted: (value: boolean) => void;
  setScreenshotFile: (value: File | null) => void;
  toggleMistake: (value: string) => void;
  submitTrade: () => void;
  resetForm: () => void;
  useLatestTradeTemplate: () => void;
};

export function TradeFormSection(props: TradeFormSectionProps) {
  const {
    cardClassName,
    inputClassName,
    textareaClassName,
    mutedClassName,
    buttonPrimaryClassName,
    buttonSecondaryClassName,
    pillClassName,
    pillActiveClassName,
    positiveClassName,
    negativeClassName,
    subtlePanelClassName,
    statusMessage,
    editingTradeId,
    date,
    ticker,
    side,
    entry,
    exit,
    shares,
    selectedSetup,
    customSetup,
    notes,
    adherenceScore,
    confidenceScore,
    emotion,
    lessonLearned,
    reviewCompleted,
    screenshotFile,
    existingScreenshotUrl,
    mistakes,
    livePnL,
    latestTradeLabel,
    setupOptions,
    mistakeOptions,
    saving,
    setDate,
    setTicker,
    setSide,
    setEntry,
    setExit,
    setShares,
    setSelectedSetup,
    setCustomSetup,
    setNotes,
    setAdherenceScore,
    setConfidenceScore,
    setEmotion,
    setLessonLearned,
    setReviewCompleted,
    setScreenshotFile,
    toggleMistake,
    submitTrade,
    resetForm,
    useLatestTradeTemplate,
  } = props;

  const hasError =
    statusMessage.toLowerCase().includes("wrong") ||
    statusMessage.toLowerCase().includes("failed") ||
    statusMessage.toLowerCase().includes("error");

  return (
    <section id="journal" className={`${cardClassName} scroll-mt-28 p-6 md:p-7`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {editingTradeId !== null ? "Edit Trade" : "Add Trade"}
          </h2>
          <p className={`mt-1 text-sm ${mutedClassName}`}>
            Log the trade, the setup, and the mistakes you want to stop repeating.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className={buttonSecondaryClassName}
          >
            Use Today
          </button>
          {latestTradeLabel ? (
            <button
              type="button"
              onClick={useLatestTradeTemplate}
              className={buttonSecondaryClassName}
            >
              Reuse {latestTradeLabel}
            </button>
          ) : null}
        </div>
      </div>

      {statusMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            hasError
              ? "border-[#ff4d4f]/20 bg-[#ff4d4f]/8 text-[#ffb4b8]"
              : "border-[#00c076]/20 bg-[#00c076]/8 text-[#c8ffe6]"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitTrade();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClassName} />
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Ticker</label>
            <input
              placeholder="AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className={inputClassName}
              autoFocus
            />
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Position</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setSide("Long")} className={side === "Long" ? buttonPrimaryClassName : buttonSecondaryClassName}>Long</button>
              <button type="button" onClick={() => setSide("Short")} className={side === "Short" ? buttonPrimaryClassName : buttonSecondaryClassName}>Short</button>
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Entry Price</label>
            <input type="number" placeholder="100.00" value={entry} onChange={(e) => setEntry(e.target.value)} className={inputClassName} />
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Exit Price</label>
            <input type="number" placeholder="105.00" value={exit} onChange={(e) => setExit(e.target.value)} className={inputClassName} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Shares</label>
            <input type="number" placeholder="10" value={shares} onChange={(e) => setShares(e.target.value)} className={inputClassName} />
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Setup</label>
            <select value={selectedSetup} onChange={(e) => setSelectedSetup(e.target.value)} className={inputClassName}>
              <option value="">Select setup</option>
              {setupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {selectedSetup === "Other" && (
              <input type="text" placeholder="Enter custom setup" value={customSetup} onChange={(e) => setCustomSetup(e.target.value)} className={`${inputClassName} mt-3`} />
            )}
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Notes</label>
          <textarea placeholder="Why did you take it? What would you do differently?" value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClassName} />
        </div>

        <div className={subtlePanelClassName}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Post-Trade Review</p>
              <p className={`mt-2 text-sm ${mutedClassName}`}>
                Score the execution quality and capture the lesson while the trade is still fresh.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={reviewCompleted}
                onChange={(e) => setReviewCompleted(e.target.checked)}
              />
              Review completed
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Plan Adherence</label>
              <select value={adherenceScore} onChange={(e) => setAdherenceScore(e.target.value)} className={inputClassName}>
                <option value="">Rate 1-5</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} / 5
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Confidence</label>
              <select value={confidenceScore} onChange={(e) => setConfidenceScore(e.target.value)} className={inputClassName}>
                <option value="">Rate 1-5</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} / 5
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Emotion</label>
            <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className={inputClassName}>
              <option value="">Select emotion</option>
              {["Calm", "Confident", "Neutral", "Hesitant", "FOMO", "Frustrated", "Overconfident"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Lesson Learned</label>
            <textarea
              placeholder="What should you repeat or avoid next time?"
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              className={textareaClassName}
            />
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Screenshot</label>
          <input type="file" accept="image/*" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} className={inputClassName} />
          {(screenshotFile || existingScreenshotUrl) && (
            <div className="mt-3">
              <p className={`mb-2 text-xs ${mutedClassName}`}>Preview</p>
              <TradeScreenshot
                src={screenshotFile ? URL.createObjectURL(screenshotFile) : existingScreenshotUrl}
                alt="Trade screenshot preview"
                wrapperClassName="relative h-48 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10"
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className={`mb-3 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Mistake Tags</label>
          <div className="flex flex-wrap gap-2">
            {mistakeOptions.map((mistake) => (
              <button
                key={mistake}
                type="button"
                onClick={() => toggleMistake(mistake)}
                className={mistakes.includes(mistake) ? pillActiveClassName : pillClassName}
              >
                {mistake}
              </button>
            ))}
          </div>
        </div>

        <div className={subtlePanelClassName}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}>Live P&amp;L</p>
          <p className={`mt-3 text-3xl font-semibold tracking-tight ${livePnL >= 0 ? positiveClassName : negativeClassName}`}>
            {livePnL >= 0 ? "+" : ""}${livePnL.toFixed(2)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
            <button type="submit" disabled={saving} className={`${buttonPrimaryClassName} w-full`}>
              {saving ? "Saving..." : editingTradeId !== null ? "Save Changes" : "Add Trade"}
            </button>
          <button type="button" onClick={resetForm} className={`${buttonSecondaryClassName} w-full`}>
            {editingTradeId !== null ? "Cancel Edit" : "Clear Form"}
          </button>
        </div>
        <p className={`text-xs ${mutedClassName}`}>
          Save the trade first. Add deeper review context only when it helps you learn.
        </p>
      </form>
    </section>
  );
}
