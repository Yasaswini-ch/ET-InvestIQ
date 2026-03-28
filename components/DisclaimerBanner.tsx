"use client";
import { useState, useEffect } from "react";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("disclaimer_seen");
    if (!seen) setDismissed(false);
  }, []);

  function dismiss() {
    localStorage.setItem("disclaimer_seen", "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto liquid-glass border border-yellow-500/30 rounded-xl p-4 flex items-start gap-4">
        <span className="text-yellow-400 text-xl">⚠</span>
        <div className="flex-1">
          <p className="text-yellow-200 text-sm font-medium">
            Not SEBI Registered — Educational Use Only
          </p>
          <p className="text-yellow-200/60 text-xs mt-1">
            ET InvestIQ is not a SEBI-registered investment advisor. Nothing on
            this platform constitutes financial advice. All analysis is
            AI-generated and for informational purposes only. Please consult a
            qualified financial advisor before making investment decisions.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-yellow-400/60 hover:text-yellow-400 text-sm px-3 py-1 border border-yellow-500/30 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
