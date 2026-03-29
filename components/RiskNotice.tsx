"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function RiskNotice({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-white/70">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-2 text-amber-300">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-amber-200">{title}</p>
          <p>{body}</p>
          <div className="pt-1 text-xs text-white/50">
            Informational only, not investment advice. See{" "}
            <Link href="/data-use" className="text-emerald-300 hover:text-emerald-200">
              how we use your data
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-emerald-300 hover:text-emerald-200">
              terms
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
