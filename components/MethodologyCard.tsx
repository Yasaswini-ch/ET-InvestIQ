"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function MethodologyCard({
  title,
  summary,
  bullets,
}: {
  title: string;
  summary: string;
  bullets: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <button onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-4 text-left">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">Methodology</p>
          <p className="mt-1 text-sm font-medium text-white">{title}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <p className="mt-2 text-sm text-white/65">{summary}</p>
      {open && (
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
