"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info, Calendar, Search, Filter, Radar, Bookmark, X, RefreshCw } from 'lucide-react';
import SignalCard from '@/components/SignalCard';
import PageHeader from '@/components/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { STORAGE_KEYS, readStoredJson, writeStoredJson } from '@/lib/storage';
import { getRadarPortfolioImpact, RadarPortfolioSnapshot } from '@/lib/radar/portfolioImpact';
import { RadarResponse, RadarSignal } from '@/lib/types/radar';

const SIGNAL_TYPES = ['bulk_deal', 'insider_buy', 'breakout', 'earnings_surprise', 'sector_rotation'];
const WATCHLIST_KEY = STORAGE_KEYS.watchlist;

function loadWatchlist(): string[] {
  return readStoredJson<string[]>(WATCHLIST_KEY) ?? [];
}

function saveWatchlist(ids: string[]) {
  writeStoredJson(WATCHLIST_KEY, ids);
}

export default function RadarPage() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedConviction, setSelectedConviction] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [portfolioSnapshot, setPortfolioSnapshot] = useState<RadarPortfolioSnapshot | null>(null);

  useEffect(() => {
    setWatchlist(loadWatchlist());
    const detailedSnapshot = readStoredJson<RadarPortfolioSnapshot>(STORAGE_KEYS.xrayResult);
    const lightSnapshot = readStoredJson<RadarPortfolioSnapshot>(STORAGE_KEYS.portfolioContext);
    setPortfolioSnapshot(detailedSnapshot ?? lightSnapshot ?? null);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/radar');
      if (!res.ok) throw new Error('Failed to fetch signals');
      const jsonData = (await res.json()) as RadarResponse;
      setData(jsonData);
      setLastFetchedAt(jsonData.generatedAt || new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch signals';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveWatchlist(next);
      return next;
    });
  };

  const toggleConviction = (v: string) =>
    setSelectedConviction(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleType = (v: string) =>
    setSelectedTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const clearFilters = () => { setSearch(''); setSelectedConviction([]); setSelectedTypes([]); };

  const filteredSignals = useMemo(() => {
    if (!data?.signals) return [];
    let signals = data.signals;
    if (activeTab === 'watchlist') signals = signals.filter((s) => watchlist.includes(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      signals = signals.filter((s) =>
        s.ticker.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q) || (s.sector?.toLowerCase() || '').includes(q)
      );
    }
    if (selectedConviction.length > 0) {
      signals = signals.filter((signal) => {
        const confidencePct = signal.signalScore ?? (signal.riskLevel === "low" ? 38 : signal.conviction === "high" ? 82 : 61);
        return selectedConviction.some((filter) =>
          filter === "LOW"
            ? signal.riskLevel === "low" || confidencePct < 40
            : signal.conviction.toUpperCase() === filter
        );
      });
    }
    if (selectedTypes.length > 0) signals = signals.filter((s: any) => selectedTypes.includes(s.type));
    return signals;
  }, [data, search, selectedConviction, selectedTypes, activeTab, watchlist]);

  const activeFilterCount = selectedConviction.length + selectedTypes.length;
  const portfolioMatches = useMemo(
    () =>
      filteredSignals.filter((signal) => {
        const impact = getRadarPortfolioImpact(signal, portfolioSnapshot);
        return impact.status === 'direct' || impact.status === 'thematic';
      }).length,
    [filteredSignals, portfolioSnapshot]
  );
  const fetchedAgo = useMemo(() => {
    if (!lastFetchedAt) return "just now";
    const diffMs = Date.now() - new Date(lastFetchedAt).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return "just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  }, [lastFetchedAt]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return <TrendingUp className="text-emerald-400 w-5 h-5" />;
      case 'bearish': return <TrendingDown className="text-red-400 w-5 h-5" />;
      default: return <Minus className="text-yellow-400 w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Opportunity Radar"
        description="High-conviction stock market signals generated by AI, identifying technical breakouts, bulk deals, and sector rotation."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="liquid-glass p-2 rounded-lg text-white/60 hover:text-emerald-400 transition-all disabled:opacity-50"
              title="Refresh signals"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1 liquid-glass p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}
              >
                All Signals
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'watchlist' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}
              >
                <Bookmark className="w-3 h-3" />
                Watchlist
                {watchlist.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'watchlist' ? 'bg-white/30' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {watchlist.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 liquid-glass rounded-2xl shimmer"></div>
            ))}
          </motion.div>
        ) : data ? (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Market Outlook Banner */}
            <div className="liquid-glass rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.04]">
                <Radar className="w-32 h-32 text-emerald-400" />
              </div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-7">
                <div className="lg:col-span-2">
                  <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Live Feed</span>
                    <span className="text-[10px] text-white/40">Last fetched: {fetchedAgo}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-400/20 rounded-lg">
                      {getSentimentIcon(data.marketSentiment)}
                    </div>
                    <h2 className="text-xl font-bold text-white font-display">
                      Market Outlook:{' '}
                      <span className={data.marketSentiment.toLowerCase() === 'bullish' ? 'text-emerald-400' : data.marketSentiment.toLowerCase() === 'bearish' ? 'text-red-400' : 'text-yellow-400'}>
                        {data.marketSentiment}
                      </span>
                    </h2>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{data.sentimentReason}</p>
                </div>
                <div className="p-5 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                    <Calendar className="w-3 h-3" />
                    Nifty 50 Outlook
                  </div>
                  <p className="text-white font-medium text-sm">{data.niftyOutlook}</p>
                </div>
                <div className="p-5 bg-emerald-500/10 border border-emerald-400/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    <TrendingUp className="w-3 h-3" />
                    Top Sector
                  </div>
                  <p className="text-emerald-400 font-bold text-xl">{data.topSector}</p>
                </div>
              </div>
              {data.sourceStatus && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {Object.entries(data.sourceStatus).map(([source, status]) => (
                    <span
                      key={source}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        status === "ok"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-400/20"
                          : status === "partial"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-400/20"
                          : "bg-red-500/10 text-red-400 border-red-400/20"
                      }`}
                    >
                      {source.toUpperCase()}: {String(status).toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="liquid-glass rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Portfolio Impact</p>
                <p className="mt-2 text-2xl font-bold text-white">{portfolioMatches}</p>
                <p className="mt-1 text-xs text-white/60">
                  {portfolioSnapshot
                    ? "signals in the current view map to your latest X-Ray snapshot"
                    : "run X-Ray to see which signals touch your holdings"}
                </p>
              </div>
              <div className="liquid-glass rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Portfolio Context</p>
                <p className="mt-2 text-sm font-bold text-white">
                  {portfolioSnapshot ? "Loaded from X-Ray" : "Not loaded"}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {portfolioSnapshot
                    ? "Radar is now highlighting direct and thematic overlaps for each signal."
                    : "Upload or run Portfolio X-Ray once to personalize this feed."}
                </p>
              </div>
              <div className="liquid-glass rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Signal Finder</p>
                <p className="mt-2 text-sm font-bold text-white">What changed, why it matters, and whether it hits your portfolio</p>
                <p className="mt-1 text-xs text-white/60">This keeps Radar aligned with the challenge brief instead of showing raw headlines.</p>
              </div>
            </div>

            {/* Signals Grid */}
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-display">
                    {activeTab === 'watchlist' ? 'My Watchlist' : 'Active Signals'}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-400/20">
                    {filteredSignals.length}
                  </span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-400/20 hover:bg-emerald-500/20 transition-all">
                      <X className="w-2.5 h-2.5" /> Clear filters
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search ticker, company..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-white/20 w-48"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setFilterOpen(!filterOpen)}
                      className={`flex items-center gap-1.5 p-2 border rounded-lg text-xs font-bold transition-all ${activeFilterCount > 0 ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400' : 'liquid-glass border-white/10 text-white/60 hover:text-white'}`}
                    >
                      <Filter className="w-4 h-4" />
                      {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
                    </button>

                    {filterOpen && (
                      <div className="absolute right-0 top-10 z-20 w-64 liquid-glass rounded-xl shadow-lg p-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Conviction</p>
                          <div className="flex gap-2">
                            {["HIGH", "MEDIUM", "LOW"].map((v) => (
                              <button key={v} onClick={() => toggleConviction(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  selectedConviction.includes(v)
                                    ? v === 'HIGH'
                                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                      : v === 'MEDIUM'
                                        ? 'bg-yellow-500/10 border-yellow-400/20 text-yellow-400'
                                        : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Signal Type</p>
                          <div className="flex flex-wrap gap-2">
                            {SIGNAL_TYPES.map(t => (
                              <button key={t} onClick={() => toggleType(t)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  selectedTypes.includes(t)
                                    ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                }`}
                              >
                                {t.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { clearFilters(); setFilterOpen(false); }} className="w-full py-1.5 text-xs font-bold text-white/60 hover:text-emerald-400 transition-colors">
                          Reset all
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filteredSignals.length === 0 ? (
                <div className="py-16 text-center liquid-glass rounded-2xl">
                  {activeTab === 'watchlist' ? (
                    <>
                      <Bookmark className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-sm font-bold text-white/80 mb-1">No saved signals yet</p>
                      <p className="text-xs text-white/60">Bookmark signals from the All Signals tab to track them here.</p>
                    </>
                  ) : (
                    <>
                      <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-sm font-bold text-white/80 mb-1">No signals match your filters</p>
                      <button onClick={clearFilters} className="text-xs text-emerald-400 font-bold hover:underline">Clear filters</button>
                    </>
                  )}
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredSignals.map((signal: RadarSignal) => (
                    <motion.div key={signal.id} variants={staggerItem}>
                      <SignalCard
                        signal={signal}
                        isWatchlisted={watchlist.includes(signal.id)}
                        onWatchlistToggle={toggleWatchlist}
                        portfolioImpact={getRadarPortfolioImpact(signal, portfolioSnapshot)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="liquid-glass rounded-xl p-5 flex items-center gap-4 text-white/60">
              <Info className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <p className="text-xs leading-relaxed italic">
                Disclaimer: These signals are AI-generated based on historical data and market indicators. They are for educational purposes only and do not constitute financial advice. Always consult with a registered investment advisor before making any investment decisions.
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <div className="p-12 text-center liquid-glass rounded-2xl">
            <TrendingDown className="w-10 h-10 text-red-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <button onClick={fetchData} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all">
              Retry
            </button>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
