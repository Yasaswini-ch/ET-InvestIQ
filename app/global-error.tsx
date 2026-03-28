"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="max-w-xl w-full liquid-glass rounded-2xl border border-red-500/20 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">App Error</p>
            <h1 className="text-2xl font-heading italic text-white">The app shell failed to render</h1>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              A shared layout or root-level client component threw during render.
            </p>
            <pre className="mt-4 text-left text-xs whitespace-pre-wrap break-words bg-black/40 border border-white/10 rounded-xl p-4 text-red-300">
              {error.message}
            </pre>
            <button
              onClick={() => reset()}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

