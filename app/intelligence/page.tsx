"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Landmark, Eye, Brain, ChevronLeft } from "lucide-react";
import LayerShell from "@/components/Intelligence/LayerShell";
import Layer1Budget from "@/components/Intelligence/Layer1Budget";
import Layer2Promoters from "@/components/Intelligence/Layer2Promoters";
import Layer3StayCourse from "@/components/Intelligence/Layer3StayCourse";
import { STORAGE_KEYS } from "@/lib/storage";

type IntelligencePageState = {
  hasError: boolean;
};

class IntelligenceErrorBoundary extends Component<{ children: ReactNode }, IntelligencePageState> {
  state: IntelligencePageState = { hasError: false };

  static getDerivedStateFromError(): IntelligencePageState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Intelligence page render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
          <div className="max-w-xl w-full liquid-glass rounded-2xl border border-red-500/20 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Intelligence Error</p>
            <h2 className="text-2xl font-heading italic text-white">This layer needs a fresh load</h2>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              A child component failed while rendering. Refresh once, or reopen the Intelligence Centre after X-Ray is ready.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function IntelligencePage() {
  // expandedLayer: 1 | 2 | 3 | null. All collapsed on load, but Layer 1 starts expanded
  const [expandedLayer, setExpandedLayer] = useState<1|2|3|null>(1);
  const [portfolioContext, setPortfolioContext] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const raw =
      localStorage.getItem(STORAGE_KEYS.xrayResult) ??
      localStorage.getItem(STORAGE_KEYS.legacyXrayResult);
    if (raw) {
      try {
        setPortfolioContext(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse portfolio context", e);
      }
    }
  }, []);

  const handleToggle = (layerNumber: 1|2|3) => {
    setExpandedLayer(prev => prev === layerNumber ? null : layerNumber);
  };

  return (
    <IntelligenceErrorBoundary>
    <div className="min-h-screen bg-black text-white pb-24">
      {/* HEADER SECTION */}
      <div className="pt-24 pb-12 text-center px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3 mb-6 text-left">
          <Link href="/" className="liquid-glass p-2 rounded-lg text-white/60 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Back to Dashboard</span>
        </div>
        <span className="liquid-glass rounded-full px-4 py-1.5 text-xs font-bold font-body text-white uppercase tracking-widest inline-block mb-6">
          Intelligence Centre
        </span>
        <h1 className="font-heading italic text-5xl md:text-6xl text-white tracking-tight leading-[1] max-w-4xl mx-auto">
          Three Layers of Market Intelligence.
        </h1>
        <p className="text-white/60 font-body font-light text-lg max-w-2xl mx-auto mt-6">
          Macro policy. Smart money. Your own behavior. Most investors see one layer. You now see all three.
        </p>

        {portfolioContext ? (
          <div className="liquid-glass rounded-xl px-5 py-3 border border-emerald-500/20 mt-8 inline-flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-body font-bold uppercase tracking-wider">
              Portfolio loaded — all three layers are personalised to your holdings
            </span>
          </div>
        ) : (
          <div className="liquid-glass rounded-xl px-5 py-3 border border-white/10 mt-8 inline-flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="text-white/40 text-sm font-body font-bold uppercase tracking-wider">
              No portfolio context. Showing general market views. <a href="/xray" className="text-emerald-400 hover:underline">Run X-Ray first →</a>
            </span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-2 relative z-10">
        {/* LAYER 1 */}
        <LayerShell
          layerNumber={1}
          label="Policy Intelligence"
          title="How the Budget affects your money"
          description="Cross-reference your portfolio against real Budget 2026-27 announcements to get your exact tax and allocation impact in rupees."
          icon={<Landmark className="w-4 h-4 text-blue-400" />}
          isExpanded={expandedLayer === 1}
          onToggle={() => handleToggle(1)}
          isLoading={false}
        >
          <Layer1Budget portfolioContext={portfolioContext} />
        </LayerShell>

        {/* CONNECTOR 1 -> 2 */}
        <div className="flex justify-center -my-2.5">
          <div className="h-12 w-px bg-white/10 flex flex-col justify-center items-center overflow-hidden">
             <ChevronDown className="w-4 h-4 text-white/20 mt-2" />
          </div>
        </div>

        {/* LAYER 2 */}
        <LayerShell
          layerNumber={2}
          label="Smart Money Intelligence"
          title="Where insiders are putting their skin in the game"
          description="Promoter buying with personal money is the most reliable signal in Indian markets. Here's where insiders are buying right now."
          icon={<Eye className="w-4 h-4 text-amber-400" />}
          isExpanded={expandedLayer === 2}
          onToggle={() => handleToggle(2)}
          isLoading={false}
        >
          <Layer2Promoters isExpanded={expandedLayer === 2} portfolioContext={portfolioContext} />
        </LayerShell>

        {/* CONNECTOR 2 -> 3 */}
        <div className="flex justify-center -my-2.5">
          <div className="h-12 w-px bg-white/10 flex flex-col justify-center items-center overflow-hidden">
             <ChevronDown className="w-4 h-4 text-white/20 mt-2" />
          </div>
        </div>

        {/* LAYER 3 */}
        <LayerShell
          layerNumber={3}
          label="Behavioral Intelligence"
          title="Why your SIP is your best weapon right now"
          description="Markets falling? Your SIP is buying more units at a discount. Here is exactly what that means for your wealth in rupees."
          icon={<Brain className="w-4 h-4 text-emerald-400" />}
          isExpanded={expandedLayer === 3}
          onToggle={() => handleToggle(3)}
          isLoading={false}
        >
          <Layer3StayCourse isExpanded={expandedLayer === 3} portfolioContext={portfolioContext} />
        </LayerShell>
      </div>
    </div>
    </IntelligenceErrorBoundary>
  );
}
