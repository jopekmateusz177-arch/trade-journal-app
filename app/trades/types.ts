export type Trade = {
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
  adherence_score?: number | null;
  confidence_score?: number | null;
  emotion?: string | null;
  lesson_learned?: string | null;
  review_completed?: boolean | null;
  screenshot_url?: string | null;
  created_at?: string;
};

export type SortField =
  | "date"
  | "ticker"
  | "side"
  | "entry"
  | "exit"
  | "shares"
  | "setup"
  | "pnl";
