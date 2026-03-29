"use client";

import { AlertTriangle, Clock3, RefreshCcw } from "lucide-react";

interface LiveDataStatusProps {
  label?: string;
  timestamp?: string | null;
  fallbackUsed?: boolean;
  staleMessage?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export default function LiveDataStatus({
  label = "Live data status",
  timestamp,
  fallbackUsed = false,
  staleMessage = "Data may be delayed. Please verify important decisions against the cited sources.",
  retryLabel = "Retry",
  onRetry,
}: LiveDataStatusProps) {
  return (
    <div className="liquid-glass rounded-2xl border border-white/10 p-4 text-sm text-white/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-300" />
          <span className="font-medium text-white/85">{label}</span>
        </div>
        {timestamp && (
          <span className="text-xs text-white/45">
            Last updated {new Date(timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        )}
      </div>
      {fallbackUsed && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            {staleMessage}
          </div>
          {onRetry && (
            <button onClick={onRetry} className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white">
              <RefreshCcw className="h-3 w-3" />
              {retryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
