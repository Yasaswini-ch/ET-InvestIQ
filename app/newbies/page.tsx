"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Lightbulb,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

type LearningCard = {
  id: string;
  question: string;
  answer: string;
  action: string;
};

type LearningModule = {
  id: string;
  label: string;
  icon: "basics" | "risk" | "entry" | "mistakes" | "behavior";
  cards: LearningCard[];
};

type DailyChallenge = {
  day: number;
  scenario: string;
  options: string[];
  correct: number;
  explanation: string;
};

const PROGRESS_KEY = "newbies_completed";
const STREAK_KEY = "newbie_challenge_streak";
const CHALLENGE_PREFIX = "challenge_";

const MODULES: LearningModule[] = [
  {
    id: "market-basics",
    label: "Market Basics",
    icon: "basics",
    cards: [
      {
        id: "market-basics-1",
        question: "What actually moves stock prices?",
        answer:
          "Earnings, interest rates, FII flows, and sentiment. In India, FII activity often drives short-term moves more than fundamentals.",
        action: "Check FII/DII data on the NSE website every Monday morning.",
      },
      {
        id: "market-basics-2",
        question: "Why does Nifty matter to your mutual fund?",
        answer:
          "Most equity funds benchmark against Nifty 50 or Nifty 500. When Nifty falls 10%, your large cap fund likely falls 8-12%. That is normal and not a reason to exit.",
        action: "Check your fund's benchmark in its factsheet.",
      },
      {
        id: "market-basics-3",
        question: "What is NAV and why does it change daily?",
        answer:
          "NAV is your fund's per-unit price. It changes daily based on the closing prices of all stocks the fund holds. A lower NAV does not mean a cheap fund.",
        action: "Look up your fund's NAV history on the AMFI website.",
      },
      {
        id: "market-basics-4",
        question: "What is the difference between Sensex and Nifty?",
        answer:
          "Sensex tracks 30 companies on BSE. Nifty tracks 50 companies on NSE. Nifty is more representative, but both move almost identically.",
        action: "Bookmark NSEIndia.com for reliable market data.",
      },
    ],
  },
  {
    id: "risk-sizing",
    label: "Risk & Sizing",
    icon: "risk",
    cards: [
      {
        id: "risk-sizing-1",
        question: "How much of your salary should you invest?",
        answer:
          "The 50-30-20 rule is a starting point: 50% needs, 30% wants, 20% savings. Keep 6 months of expenses as emergency fund first, then invest the rest.",
        action: "Calculate your 6-month emergency fund target today.",
      },
      {
        id: "risk-sizing-2",
        question: "What is concentration risk?",
        answer:
          "Putting too much in one stock, sector, or fund type. Diversification is not a suggestion. It is survival.",
        action: "Check if any single fund exceeds 30% of your portfolio.",
      },
      {
        id: "risk-sizing-3",
        question: "What does risk profile actually mean?",
        answer:
          "It is how much portfolio drop you can emotionally handle without selling. If seeing -30% makes you want to sell, you are not aggressive.",
        action: "Imagine your portfolio drops 40%. Write down what you'd do.",
      },
      {
        id: "risk-sizing-4",
        question: "What is the right number of mutual funds to hold?",
        answer:
          "Three to five funds is optimal for most retail investors. More than seven often creates overlap without adding real diversification.",
        action: "List all your funds and count unique holdings using ET InvestIQ X-Ray.",
      },
    ],
  },
  {
    id: "entry-exit",
    label: "Entry & Exit",
    icon: "entry",
    cards: [
      {
        id: "entry-exit-1",
        question: "When is the right time to start investing?",
        answer:
          "Today. Not after the election. Not after the correction. Time in market always beats timing the market.",
        action: "Start or increase one SIP by ₹500 this week.",
      },
      {
        id: "entry-exit-2",
        question: "When should you actually sell a mutual fund?",
        answer:
          "Only when your goal is reached, the fund underperforms its benchmark for 3+ years, your risk profile changes, or you need the money.",
        action: "Review your oldest fund's performance versus its benchmark.",
      },
      {
        id: "entry-exit-3",
        question: "What is rupee cost averaging?",
        answer:
          "When markets fall, your SIP buys more units for the same amount. When markets rise, it buys fewer. Over time this averages purchase cost.",
        action: "Check how many units your SIP bought in March 2020.",
      },
      {
        id: "entry-exit-4",
        question: "Should you stop your SIP when markets fall?",
        answer:
          "No. Stopping a SIP during a crash is like refusing to buy vegetables when they are on sale. You are buying future wealth at a discount.",
        action: "Go to ET InvestIQ Stay Course and make your commitment.",
      },
    ],
  },
  {
    id: "common-mistakes",
    label: "Common Mistakes",
    icon: "mistakes",
    cards: [
      {
        id: "common-mistakes-1",
        question: "What is the #1 mistake Indian retail investors make?",
        answer:
          "Checking portfolio value every day. Daily NAV movement is noise. Your SIP is a 10-20 year machine.",
        action: "Set a calendar reminder to review your portfolio quarterly, not daily.",
      },
      {
        id: "common-mistakes-2",
        question: "Why chasing last year's top performer never works",
        answer:
          "Category performance rotates every 2-3 years. Buying the winner is often buying at the top of its cycle.",
        action: "Check your highest-returning fund's 5-year rank, not 1-year.",
      },
      {
        id: "common-mistakes-3",
        question: "What is the real cost of pausing your SIP for 6 months?",
        answer:
          "A pause compounds against you. Even a short break can materially reduce final corpus over a long horizon.",
        action: "Reduce the SIP amount if cash is tight, but avoid stopping entirely.",
      },
      {
        id: "common-mistakes-4",
        question: "Why do most investors underperform their own funds?",
        answer:
          "Because they buy after rallies and sell after crashes. The fund may return 14% a year while the investor earns 8% due to bad timing.",
        action: "Read 'The Behavior Gap' by Carl Richards this week.",
      },
    ],
  },
  {
    id: "behavioral-finance",
    label: "Behavioral Finance",
    icon: "behavior",
    cards: [
      {
        id: "behavioral-finance-1",
        question: "What is loss aversion and how does it hurt you?",
        answer:
          "Humans feel the pain of a loss much more intensely than the pleasure of an equal gain. That makes us sell winners too early and hold losers too long.",
        action: "Before selling any fund, write down your reason and re-read it in 48 hours.",
      },
      {
        id: "behavioral-finance-2",
        question: "What is confirmation bias in investing?",
        answer:
          "We seek information that confirms what we already believe. Force yourself to read the bear case for every investment you hold.",
        action: "For your top holding, read one bearish analysis this week.",
      },
      {
        id: "behavioral-finance-3",
        question: "What is herd mentality and why is it expensive?",
        answer:
          "When everyone is buying, you feel FOMO. When everyone is selling, you feel panic. The crowd is usually wrong at the extremes.",
        action: "When you feel FOMO about a stock tip, wait 7 days before acting.",
      },
      {
        id: "behavioral-finance-4",
        question: "What is the endowment effect?",
        answer:
          "We overvalue things we own. A stock you bought at ₹100 that is now at ₹60 feels different from one you never bought. That bias is a trap.",
        action: "Evaluate every holding as if you were buying it today at the current price.",
      },
    ],
  },
] as const;

const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    day: 0,
    scenario:
      "Nifty is down 8% this week. Your portfolio is down 6%. Your friend says, 'sell everything and wait for the bottom.' What do you do?",
    options: ["Sell 50% and wait", "Do nothing - continue SIP", "Increase SIP amount to buy more units", "Switch to debt funds temporarily"],
    correct: 2,
    explanation:
      "Increasing SIP during a crash buys more units at lower NAV, which improves long-term returns. Waiting for the bottom is nearly impossible to time.",
  },
  {
    day: 1,
    scenario:
      "A colleague tells you about a smallcap stock that will definitely 10x in 6 months. It is already up 80% this month. What is your move?",
    options: ["Invest ₹50,000 immediately", "Invest a small amount just in case", "Research it properly before deciding", "Use Scam Shield to check the tip first"],
    correct: 3,
    explanation:
      "Any stock up 80% in a month is a red flag for pump-and-dump behaviour. Always verify tips with Scam Shield before acting.",
  },
  {
    day: 2,
    scenario:
      "Your large cap fund has returned 9% this year while Nifty 50 returned 12%. Should you exit?",
    options: ["Yes - it is underperforming", "No - one year is too short to judge", "Switch to a Nifty index fund", "Invest more to average down"],
    correct: 1,
    explanation:
      "One year of underperformance means very little. Judge actively managed funds over 3-5 year cycles before making structural changes.",
  },
  {
    day: 3,
    scenario:
      "You have ₹1 lakh to invest. Markets are at all-time highs. What is the best approach?",
    options: ["Wait for a correction to invest", "Invest all ₹1 lakh today", "Spread it as SIP over 12 months", "Put it in FD and wait"],
    correct: 2,
    explanation:
      "Spreading investment over 6-12 months reduces timing risk when markets are expensive. Waiting for a correction that may never come is often costly.",
  },
  {
    day: 4,
    scenario:
      "Your ELSS fund lock-in of 3 years is complete. The fund has returned 14% CAGR. What should you do?",
    options: ["Redeem immediately", "Continue holding if goal not reached", "Switch to a flexi cap for better returns", "Redeem and reinvest in a new ELSS"],
    correct: 1,
    explanation:
      "Lock-in ending is not a reason to exit. If your goal is still years away, let the money compound and avoid unnecessary tax friction.",
  },
  {
    day: 5,
    scenario:
      "You have 6 mutual funds. Three of them have more than 60% overlap in their top 10 holdings. What is the problem?",
    options: ["No problem - more funds means more diversification", "You are over-diversified", "You have concentration risk disguised as diversification", "Add 2 more funds to reduce overlap"],
    correct: 2,
    explanation:
      "High overlap means you own the same stocks multiple times through different funds. You pay extra expense ratios for the same exposure.",
  },
  {
    day: 6,
    scenario:
      "The budget announces LTCG tax increases on equity MFs. Your WhatsApp group says 'sell everything before April 1.' What do you do?",
    options: ["Sell all equity funds before April 1", "Nothing - tax changes rarely justify selling", "Check ET InvestIQ Budget Impact Analyzer first", "Move everything to debt funds"],
    correct: 2,
    explanation:
      "Budget changes need personalized analysis before action. Mass selling on WhatsApp advice is how investors turn paper gains into real losses.",
  },
];

function storageKeyForChallenge(dateId: string) {
  return `${CHALLENGE_PREFIX}${dateId}`;
}

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

function readCompletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function readStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { count?: number };
    return Number(parsed.count || 0);
  } catch {
    return 0;
  }
}

function getStreakLabel(count: number) {
  if (count >= 30) return "Master Investor 🏆";
  if (count >= 14) return "Disciplined Investor 💡";
  if (count >= 7) return "Market Watcher 📊";
  if (count >= 3) return "Curious Investor 🌱";
  return "Getting Started";
}

function getNextMilestone(count: number) {
  if (count < 3) return 3;
  if (count < 7) return 7;
  if (count < 14) return 14;
  if (count < 30) return 30;
  return 30;
}

function getModuleIcon(icon: LearningModule["icon"]) {
  switch (icon) {
    case "risk":
      return <ShieldCheck className="w-4 h-4" />;
    case "entry":
      return <Target className="w-4 h-4" />;
    case "mistakes":
      return <ShieldAlert className="w-4 h-4" />;
    case "behavior":
      return <Lightbulb className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
}

export default function NewbiesPage() {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [challengeLocked, setChallengeLocked] = useState(false);
  const [challengeCorrect, setChallengeCorrect] = useState(false);
  const [challengeFeedback, setChallengeFeedback] = useState("");

  const currentChallenge = DAILY_CHALLENGES[new Date().getDay()];
  const currentChallengeKey = storageKeyForChallenge(todayId());

  useEffect(() => {
    const completed = readCompletedIds();
    setCompletedIds(completed);
    setStreak(readStreak());

    try {
      const stored = localStorage.getItem(currentChallengeKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { selected?: number; correct?: boolean; explanation?: string };
        if (typeof parsed.selected === "number") setSelectedAnswer(parsed.selected);
        setChallengeLocked(true);
        setChallengeCorrect(Boolean(parsed.correct));
        setChallengeFeedback(
          parsed.correct
            ? `✓ Correct! ${parsed.explanation || currentChallenge.explanation}`
            : `The right answer was ${String.fromCharCode(65 + currentChallenge.correct)}. ${parsed.explanation || currentChallenge.explanation}`
        );
      }
    } catch {
      setChallengeLocked(false);
    }
  }, [currentChallenge.correct, currentChallenge.explanation, currentChallengeKey]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(completedIds));
    } catch {
      // ignore
    }
  }, [completedIds]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const learnedCount = completedSet.size;
  const progressPct = Math.min(100, (learnedCount / 20) * 100);

  const activeCards = MODULES.find((module) => module.id === activeModule)?.cards ?? [];
  const currentMilestone = getStreakLabel(streak);
  const nextMilestone = getNextMilestone(streak);
  const streakProgress = Math.min(100, (streak / nextMilestone) * 100);

  const toggleCard = (cardId: string) => {
    setFlippedIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    setCompletedIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  };

  const handleChallengeAnswer = (index: number) => {
    if (challengeLocked) return;
    setSelectedAnswer(index);
    const correct = index === currentChallenge.correct;
    setChallengeLocked(true);
    setChallengeCorrect(correct);

    const feedback = correct
      ? `✓ Correct! ${currentChallenge.explanation}`
      : `The right answer was ${String.fromCharCode(65 + currentChallenge.correct)}. ${currentChallenge.explanation}`;
    setChallengeFeedback(feedback);

    try {
      localStorage.setItem(
        currentChallengeKey,
        JSON.stringify({
          selected: index,
          correct,
          explanation: currentChallenge.explanation,
        })
      );
    } catch {
      // ignore
    }

    if (!correct) return;

    try {
      const stored = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}") as { date?: string; count?: number };
      const today = todayId();
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Newbie Corner"
        description="A practical learning platform for first-time investors. Build confidence one card and one daily challenge at a time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {MODULES.map((module) => {
              const active = module.id === activeModule;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`liquid-glass rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors border inline-flex items-center gap-2 ${
                    active
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "text-white/60 border-white/10 hover:text-white"
                  }`}
                >
                  {getModuleIcon(module.icon)}
                  {module.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeCards.map((card) => {
              const flipped = Boolean(flippedIds[card.id]);
              const completed = completedSet.has(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className="text-left [perspective:1000px]"
                >
                  <motion.div
                    className="relative w-full h-48 [transform-style:preserve-3d]"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.55 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="absolute inset-0 [backface-visibility:hidden] liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-white/10">
                      {completed && (
                        <span className="absolute top-4 right-4 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Question</p>
                        <h3 className="font-heading italic text-white text-lg leading-tight">{card.question}</h3>
                      </div>
                      <p className="text-white/30 text-xs">Tap to reveal →</p>
                    </div>

                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-emerald-500/20">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Explanation</p>
                        <p className="text-white/80 text-sm font-body leading-relaxed">{card.answer}</p>
                      </div>
                      <div className="liquid-glass-strong rounded-full px-3 py-1.5 text-xs text-emerald-400 inline-flex items-center gap-1.5 w-fit">
                        <Sparkles className="w-3 h-3" />
                        → {card.action}
                      </div>
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="liquid-glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Trophy className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Progress</p>
            </div>
            <p className="text-sm font-bold text-white">You&apos;ve learned {learnedCount} of 20 concepts</p>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Flame className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Streak</p>
            </div>
            <p className="text-sm font-bold text-white">{streak} day streak</p>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-white/60">{currentMilestone}</p>
              <div className="w-full h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${streakProgress}%` }} />
              </div>
              <p className="text-[10px] text-white/40 mt-2">Next milestone: {nextMilestone} days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Daily Challenge</p>
            <h3 className="font-heading italic text-3xl text-white">Today&apos;s scenario</h3>
          </div>
          <span className="liquid-glass rounded-full px-3 py-1 text-xs text-white/50">{new Date().toLocaleDateString("en-IN", { weekday: "long" })}</span>
        </div>

        <div className="liquid-glass rounded-2xl p-6 space-y-4">
          <p className="text-white/80 text-sm leading-relaxed">{currentChallenge.scenario}</p>
          <div className="space-y-2">
            {currentChallenge.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentChallenge.correct;
              const answered = challengeLocked;
              const selectedStyle =
                answered && challengeCorrect && isSelected
                  ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                  : answered && !challengeCorrect && isSelected
                    ? "bg-red-500/10 border-red-400/20 text-red-300"
                    : answered && isCorrect
                      ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                      : "liquid-glass border-white/10 text-white/70 hover:text-white";

              return (
                <button
                  key={option}
                  onClick={() => handleChallengeAnswer(index)}
                  disabled={challengeLocked}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all disabled:cursor-not-allowed ${selectedStyle}`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + index)})</span>
                  {option}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {challengeFeedback ? (
              <motion.div
                key="challenge-feedback"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.55 }}
                className={`rounded-xl p-4 border ${
                  challengeCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {challengeCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5" />}
                  <p className="text-sm text-white/80 leading-relaxed">{challengeFeedback}</p>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="challenge-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/50"
              >
                Pick an answer to test your thinking.
              </motion.p>
            )}
          </AnimatePresence>

          {challengeLocked && (
            <div className="text-xs text-white/40">
              Come back tomorrow for the next scenario.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
