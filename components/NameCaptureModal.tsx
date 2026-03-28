"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type InvestorStage = "beginner" | "experienced" | null;
type PortfolioState = "yes" | "no" | null;

const ONBOARDING_KEY = "investor_onboarding_completed";

export default function NameCaptureModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<InvestorStage>(null);
  const [portfolioState, setPortfolioState] = useState<PortfolioState>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShow(true);
      }
    } catch {
      setShow(false);
    }
  }, []);

  const completeAndRoute = (
    href: "/newbies" | "/radar" | "/xray",
    nextStage: InvestorStage,
    nextPortfolioState: PortfolioState
  ) => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
      if (nextStage) localStorage.setItem("investor_stage", nextStage);
      if (nextPortfolioState) localStorage.setItem("portfolio_uploaded", nextPortfolioState);
    } catch {
      // Ignore storage failures.
    }

    setShow(false);
    router.push(href);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // Ignore storage failures.
    }
    setShow(false);
  };

  const handleStageSelect = (nextStage: InvestorStage) => {
    if (!nextStage) return;
    setStage(nextStage);
    if (nextStage === "beginner") {
      completeAndRoute("/newbies", nextStage, null);
    }
  };

  const handlePortfolioSelect = (nextState: PortfolioState) => {
    if (!nextState) return;
    setPortfolioState(nextState);
    completeAndRoute(nextState === "yes" ? "/xray" : "/radar", "experienced", nextState);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="liquid-glass rounded-2xl p-8 max-w-md w-full border border-white/10 relative">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close onboarding"
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/50 transition hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">
          First visit experience
        </p>
        <h2 className="font-heading italic text-2xl text-white">Welcome to ET InvestIQ</h2>
        <p className="text-white/60 text-sm mt-2">
          Let’s take you to the right starting point.
        </p>

        {!stage ? (
          <div className="mt-6 space-y-3">
            <p className="text-white/80 text-sm font-medium">Are you a beginner or an experienced investor?</p>
            <button
              onClick={() => handleStageSelect("beginner")}
              className="w-full liquid-glass rounded-xl px-4 py-3 text-left text-white/90 hover:text-white border border-white/10 hover:border-emerald-500/30 transition-colors"
            >
              Beginner
            </button>
            <button
              onClick={() => setStage("experienced")}
              className="w-full liquid-glass rounded-xl px-4 py-3 text-left text-white/90 hover:text-white border border-white/10 hover:border-emerald-500/30 transition-colors"
            >
              Experienced
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-white/80 text-sm font-medium">
              Have you uploaded your portfolio?
            </p>
            <button
              onClick={() => handlePortfolioSelect("yes")}
              className="w-full liquid-glass rounded-xl px-4 py-3 text-left text-white/90 hover:text-white border border-white/10 hover:border-emerald-500/30 transition-colors"
            >
              Yes, I have uploaded it
            </button>
            <button
              onClick={() => handlePortfolioSelect("no")}
              className="w-full liquid-glass rounded-xl px-4 py-3 text-left text-white/90 hover:text-white border border-white/10 hover:border-emerald-500/30 transition-colors"
            >
              Not yet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
