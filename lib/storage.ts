export const STORAGE_KEYS = {
  investorName: "et_investor_name",
  portfolioContext: "et_portfolio_context",
  xrayResult: "et_xray_result",
  legacyXrayResult: "xray_result",
  watchlist: "et_watchlist",
  chatHistory: "et_chat_history",
  shortcutShown: "et_shortcut_shown",
  chatShortcutToastDismissed: "et_chat_shortcut_toast_dismissed",
} as const;

export function readStoredJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures to avoid breaking UI flows.
  }
}

export function removeStoredValue(key: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures to avoid breaking UI flows.
  }
}
