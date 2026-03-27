"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen, ShieldCheck, Target, Lightbulb, Flame, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";

type Card = {
  id: string;
  title: string;
  icon: "basics" | "risk" | "strategy" | "mistakes";
  front: string;
  back: string;
  action: string;
};

type Challenge = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

const CARDS: Card[] = [
  {
    id: "market-basics",
    title: "Market Basics",
    icon: "basics",
    front: "What moves stock prices day to day?",
    back: "Earnings, guidance, liquidity, global cues, and valuation shifts. Price is short-term voting, long-term weighing.",
    action: "Track one stock for 5 days and note 3 reasons behind moves.",
  },
  {
    id: "risk-101",
    title: "Risk 101",
    icon: "risk",
    front: "How much should I put in one stock?",
    back: "Avoid concentration risk. Beginners should cap single-stock exposure and balance with index funds.",
    action: "Set a personal max allocation rule before your next trade.",
  },
  {
    id: "entry-exit",
    title: "Entry / Exit",
    icon: "strategy",
    front: "How do I avoid emotional entries?",
    back: "Use a plan: thesis, invalidation level, expected timeframe, and position size before buying.",
    action: "Write a 4-line trade checklist and use it every time.",
  },
  {
    id: "common-mistakes",
    title: "Avoid Costly Mistakes",
    icon: "mistakes",
    front: "What hurts beginners most?",
    back: "Overtrading, averaging losers blindly, and ignoring risk. Survive first, then compound.",
    action: "Review your last 5 decisions and tag one repeatable mistake.",
  },
];

const PROGRESS_KEY = "et_newbie_progress";
const STREAK_KEY = "et_newbie_streak";

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

function buildChallenge(niftyChangePercent?: number): Challenge {
  const id = `challenge-${todayId()}`;
  if (typeof niftyChangePercent === "number" && niftyChangePercent <= -1.5) {
    return {
      id,
      question: "Nifty fell sharply today. What should a long-term SIP investor generally do?",
      options: ["Pause SIP", "Increase SIP gradually", "Move all money to FD"],
      answerIndex: 1,
      explanation: "During broad market dips, continuing or increasing SIP can improve long-term average purchase cost, while keeping risk controls in place.",
    };
  }
  if (typeof niftyChangePercent === "number" && niftyChangePercent >= 1.2) {
    return {
      id,
      question: "Nifty rallied strongly today. Best beginner move?",
      options: ["Chase momentum blindly", "Review allocation and stick to plan", "Take leveraged intraday bets"],
      answerIndex: 1,
      explanation: "Strong up days can trigger FOMO. Beginners do better with disciplined allocation and position sizing over impulsive chasing.",
    };
  }
  return {
    id,
    question: "Market is range-bound this week. What helps a beginner most?",
    options: ["Frequent in-out trades", "Systematic investing + watchlist discipline", "Ignore risk limits"],
    answerIndex: 1,
    explanation: "When markets are choppy, consistency and risk discipline beat overtrading for new investors.",
  };
}

export default function NewbiesPage() {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [learnedSet, setLearnedSet] = useState<Set<string>>(new Set());
  const [challenge, setChallenge] = useState<Challenge>(buildChallenge());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]") as string[];
      setLearnedSet(new Set(progress));
      const streakRaw = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
      setStreak(streakRaw.count || 0);
    } catch {
      // ignore
    }

    const load = async () => {
      try {
        const res = await fetch("/api/market");
        const data = await res.json();
        setChallenge(buildChallenge(data?.nifty?.changePercent));
      } catch {
        setChallenge(buildChallenge());
      }
    };
    load();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(learnedSet)));
    } catch {
      // ignore
    }
  }, [learnedSet]);

  const toggle = (id: string) => {
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));
    setLearnedSet((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    if (index !== challenge.answerIndex) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}") as { date?: string; count?: number };
      const today = todayId();
      if (stored.date === today) {
        setStreak(stored.count || 0);
        return;
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayId = yesterday.toISOString().slice(0, 10);
      const nextCount = stored.date === yesterdayId ? (stored.count || 0) + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ date: today, count: nextCount }));
      setStreak(nextCount);
    } catch {
      // ignore
    }
  };

  const learnedCount = learnedSet.size;
  const progressTarget = 20;
  const progressPct = Math.min(100, (learnedCount / progressTarget) * 100);
  const challengeSolved = selectedOption === challenge.answerIndex;
  const answered = selectedOption !== null;
  const challengeStatus = useMemo(() => {
    if (!answered) return "Pick an answer to check your thinking.";
    return challengeSolved ? "Correct. Nice call under uncertainty." : "Not quite. Check the explanation and try tomorrow's challenge.";
  }, [answered, challengeSolved]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="liquid-glass p-2 rounded-lg text-white/60 hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Back to Dashboard</span>
      </div>

      <PageHeader
        title="Newbie Corner"
        description="Interactive learning cards for first-time investors. Build consistency with one daily market challenge."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 liquid-glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Daily Challenge</p>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400">
              {todayId()}
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-4">{challenge.question}</h3>
          <div className="space-y-2">
            {challenge.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === challenge.answerIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    !answered
                      ? "liquid-glass border-white/10 text-white/80 hover:border-white/20"
                      : isCorrect
                      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                      : isSelected
                      ? "bg-red-500/10 border-red-400/20 text-red-300"
                      : "liquid-glass border-white/10 text-white/60"
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)})</span>{option}
                </button>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/80">{challengeStatus}</p>
            {answered && (
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{challenge.explanation}</p>
            )}
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Trophy className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Learning Progress</p>
          </div>
          <p className="text-sm font-bold text-white">You&apos;ve learned {learnedCount}/{progressTarget} concepts</p>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
            <Flame className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-bold text-emerald-400">Current streak: {streak} day{streak === 1 ? "" : "s"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CARDS.map((card) => {
          const isOpen = Boolean(active[card.id]);
          return (
            <button
              key={card.id}
              onClick={() => toggle(card.id)}
              className="text-left liquid-glass rounded-2xl p-5 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/10 text-emerald-400 flex items-center justify-center">
                  <CardIcon type={card.icon} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{isOpen ? "Answer + Action" : "Tap to Reveal"}</p>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{isOpen ? card.back : card.front}</p>
              {isOpen && (
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Try This Today</p>
                  <p className="text-sm text-white/80">{card.action}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardIcon({ type }: { type: Card["icon"] }) {
  if (type === "risk") return <ShieldCheck className="w-5 h-5" />;
  if (type === "strategy") return <Target className="w-5 h-5" />;
  if (type === "mistakes") return <Lightbulb className="w-5 h-5" />;
  return <BookOpen className="w-5 h-5" />;
}
