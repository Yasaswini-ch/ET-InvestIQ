"use client";

import { useEffect, useState } from "react";
import { setInvestorName } from "@/lib/investor";

export default function NameCaptureModal() {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      if (!localStorage.getItem("investor_name")) {
        setShow(true);
      }
    } catch {
      setShow(false);
    }
  }, []);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setInvestorName(trimmed);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="liquid-glass rounded-2xl p-8 max-w-sm w-full border border-white/10">
        <h2 className="font-heading italic text-2xl text-white">Welcome to ET InvestIQ</h2>
        <p className="text-white/60 text-sm mt-2">What should we call you?</p>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your first name"
          className="mt-5 w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/40 transition"
        />

        <button
          onClick={save}
          disabled={!name.trim()}
          className="mt-5 liquid-glass-strong rounded-full px-8 py-3 text-white w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Investing Smarter →
        </button>

        <button
          onClick={() => setShow(false)}
          className="mt-3 w-full text-center text-white/30 text-xs hover:text-white/60 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
