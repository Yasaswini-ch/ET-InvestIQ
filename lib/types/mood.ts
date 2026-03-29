export interface MoodResponse {
  mood: "FEARFUL" | "CAUTIOUS" | "NEUTRAL" | "OPTIMISTIC" | "BULLISH";
  niftyChange: number;
  vix: number;
  fiiFlow: string;
  label: string;
  color: string;
}
