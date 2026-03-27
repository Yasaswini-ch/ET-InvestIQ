"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-white/20 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold">Application error</h2>
          <p className="mt-2 text-white/70 text-sm">A critical error occurred while rendering this page.</p>
          <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
