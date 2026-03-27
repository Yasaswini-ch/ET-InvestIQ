"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-[#E8DDD2] rounded-2xl p-6 shadow-sm text-center">
        <h2 className="text-xl font-bold text-[#111827]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[#6B7280]">Please try again. If this keeps happening, refresh once.</p>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-[#E8651A] hover:bg-[#D4520E] text-white rounded-lg text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
