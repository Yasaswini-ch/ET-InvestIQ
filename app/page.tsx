"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instrument_Serif, Barlow } from "next/font/google";
import {
  ArrowUpRight,
  Play,
  Zap,
  TrendingUp,
  Shield,
  BookOpen,
} from "lucide-react";
import BlurText from "@/components/BlurText";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-heading",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const sectionMotion = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: "easeOut" as const },
  viewport: { once: true },
};

const tickerItems = [
  ["NIFTY 50", "+0.43%"],
  ["SENSEX", "+0.31%"],
  ["RELIANCE", "+1.2%"],
  ["HDFC BANK", "-0.8%"],
  ["INFOSYS", "+2.1%"],
  ["TATAMOTORS", "+3.4%"],
  ["WIPRO", "-0.3%"],
] as const;

const navItems = [
  { label: "Platform", href: "/xray" },
  { label: "Features", href: "/#features" },
  { label: "Radar", href: "/radar" },
  { label: "Charts", href: "/charts" },
  { label: "Learn", href: "/newbies" },
] as const;

const tools = [
  {
    title: "Portfolio X-Ray",
    heading: "Know exactly what's hiding in your portfolio.",
    description:
      "Upload your CAS PDF and get an instant health score, XIRR, expense drag, overlap heatmap, and rebalancing actions - explained like a CFP would.",
    chips: ["Health Score", "XIRR", "Overlap Heatmap", "Rebalancing"],
    button: "Open X-Ray",
    href: "/xray",
    reverse: false,
    visual: <XrayVisual />,
  },
  {
    title: "Opportunity Radar",
    heading: "Every market signal. One radar.",
    description:
      "BSE announcements, NSE bulk deals, SEBI RSS - ingested, normalized, ranked, and enriched with AI reasoning, catalysts, and conviction scores in real time.",
    chips: ["BSE Feeds", "NSE Bulk Deals", "SEBI Alerts", "AI Conviction"],
    button: "Open Radar",
    href: "/radar",
    reverse: true,
    visual: <RadarVisual />,
  },
  {
    title: "Market Intelligence Chat",
    heading: "Ask anything about the Indian market.",
    description:
      "Chat with live Nifty/Sensex context, recent radar events, and your own portfolio data baked in. Citations included - no hallucination.",
    chips: ["Live Market Context", "Portfolio-Aware", "Cited Responses"],
    button: "Open Chat",
    href: "/chat",
    reverse: false,
    visual: <ChatVisual />,
  },
  {
    title: "Chart Pattern Intelligence",
    heading: "See what the chart is trying to tell you.",
    description:
      "Real OHLCV candles from Yahoo Finance. AI detects patterns, identifies support/resistance, and gives you bias, confidence %, and estimated success rate.",
    chips: ["Real OHLCV", "Pattern Detection", "Support/Resistance", "AI Confidence"],
    button: "Open Charts",
    href: "/charts",
    reverse: true,
    visual: <ChartVisual />,
  },
  {
    title: "Newbie Corner",
    heading: "First time investing? Start here.",
    description:
      "Flip-card learning for new investors. Market basics, risk controls, entry/exit discipline, common mistakes - each with one immediate action to take.",
    chips: ["Beginner-Friendly", "Flip Cards", "Actionable Steps"],
    button: "Open Newbie Corner",
    href: "/newbies",
    reverse: false,
    visual: <NewbieVisual />,
  },
];

const testimonials = [
  {
    quote:
      "The X-Ray feature found 40% overlap between my MFs in 30 seconds. I had no idea. Rebalanced the same week.",
    name: "Priya Nair",
    role: "Retail Investor, Bengaluru",
  },
  {
    quote:
      "The Opportunity Radar caught the SEBI circular before my broker even called me. That's the edge I needed.",
    name: "Arjun Mehta",
    role: "Active Trader, Mumbai",
  },
  {
    quote:
      "I was scared of investing. Newbie Corner made it feel like a game. Now I have an SIP in 3 funds.",
    name: "Divya Srinivasan",
    role: "First-time Investor, Chennai",
  },
];

export default function Home() {
  return (
    <main className={`bg-black overflow-x-hidden ${instrument.variable} ${barlow.variable}`}>
        <Navbar />
        <Hero />

      <motion.section className="py-16 text-center" {...sectionMotion}>
        <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-6">
          Powered by real data, not hallucination
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 text-2xl md:text-3xl font-heading italic text-white">
          <span>BSE</span>
          <span>NSE</span>
          <span>SEBI</span>
          <span>Yahoo Finance</span>
          <span>Google Gemini</span>
        </div>
      </motion.section>

      <HowItWorks />

      <section id="features" className="py-24 px-6 md:px-16 lg:px-24 bg-black">
        <motion.div className="text-center mb-16" {...sectionMotion}>
          <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4">
            All Five Tools
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
            Pro intelligence. Zero jargon.
          </h2>
        </motion.div>

        <div className="space-y-14">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, x: tool.reverse ? 70 : -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              viewport={{ once: true }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${tool.reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/45 mb-3 font-body">{tool.title}</p>
                <h3 className="text-3xl md:text-4xl font-heading italic text-white tracking-tight leading-[0.95]">
                  {tool.heading}
                </h3>
                <p className="mt-4 text-white/60 text-sm font-body font-light max-w-xl">{tool.description}</p>
                <div className="flex gap-2 flex-wrap mt-4">
                  {tool.chips.map((chip) => (
                    <span key={chip} className="liquid-glass rounded-full px-3 py-1 text-xs text-white/70 font-body">
                      {chip}
                    </span>
                  ))}
                </div>
                <Link
                  href={tool.href}
                  className="mt-6 inline-flex items-center gap-2 liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white font-body"
                >
                  {tool.button} <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              {tool.visual}
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section className="py-24 px-6 md:px-16 lg:px-24 bg-black" {...sectionMotion}>
        <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4">
          Why ET InvestIQ
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          The difference is everything.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            [Zap, "Real Data, Not Guesses", "Every insight is backed by live BSE, NSE, and SEBI feeds. No hallucination."],
            [TrendingUp, "Built for India", "Nifty, Sensex, NSE tickers, SEBI regulations - designed from the ground up for Indian markets."],
            [Shield, "Transparent AI", "Every AI response cites its source. You always know why it said what it said."],
            [BookOpen, "Beginner to Pro", "Whether you're new or experienced, the platform scales with your knowledge."],
          ].map(([Icon, title, desc]) => (
            <div key={String(title)} className="liquid-glass rounded-2xl p-6">
              <div className="liquid-glass-strong rounded-full w-10 h-10 flex items-center justify-center mb-4 text-white">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-heading italic text-white">{String(title)}</h3>
              <p className="text-white/60 font-body font-light text-sm mt-2">{String(desc)}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="relative overflow-hidden py-32 bg-black">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(5,46,22,0.45),transparent_55%)] animate-[pulse-glow_8s_ease-in-out_infinite]" />
        <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]" />
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]" />

        <motion.div className="relative z-10 liquid-glass rounded-3xl p-12 md:p-16 max-w-4xl mx-auto" {...sectionMotion}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              ["5 Tools", "In one platform"],
              ["3 Live Feeds", "BSE · NSE · SEBI"],
              ["Real OHLCV", "Yahoo Finance data"],
              ["Zero Jargon", "Explained in plain English"],
            ].map(([value, label]) => (
              <div key={value}>
                <p className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white">{value}</p>
                <p className="text-white/60 font-body font-light text-sm mt-2">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-6 md:px-16 lg:px-24 bg-black">
        <motion.div {...sectionMotion}>
          <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4">
            Early Users
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
            Investors who tried it, stayed.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {testimonials.map((item) => (
            <motion.article key={item.name} className="liquid-glass rounded-2xl p-8" {...sectionMotion}>
              <p className="text-white/80 font-body font-light text-sm italic leading-relaxed">"{item.quote}"</p>
              <p className="text-white font-body font-medium text-sm mt-6">{item.name}</p>
              <p className="text-white/50 font-body font-light text-xs mt-0.5">{item.role}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden min-h-[600px] bg-black py-32 px-6">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_75%_20%,rgba(5,46,22,0.4),transparent_55%)] animate-[pulse-glow_9s_ease-in-out_infinite]" />
        <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]" />
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]" />

        <motion.div className="relative z-10 text-center max-w-5xl mx-auto" {...sectionMotion}>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading italic text-white tracking-tight leading-[0.9]">
            Your investment edge starts here.
          </h2>
          <p className="text-white/60 font-body font-light text-lg mt-6">
            Free to try. No account needed for demo. Built for Indian retail investors.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/xray"
              className="liquid-glass-strong rounded-full text-white font-body font-medium px-6 py-3 inline-flex items-center gap-2"
            >
              Analyse My Portfolio <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#features"
              className="bg-white text-black rounded-full font-body font-medium px-6 py-3 inline-flex items-center gap-2"
            >
              Explore All Tools
            </Link>
          </div>

          <footer className="mt-24 pt-8 border-t border-white/10 flex justify-between items-center flex-wrap gap-4">
            <p className="text-white/40 text-xs font-body">
              © 2026 ET InvestIQ - Not SEBI registered. For informational use only.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40 font-body">
              <Link href="/help" className="hover:text-white/60 transition">Privacy</Link>
              <Link href="/help" className="hover:text-white/60 transition">Terms</Link>
              <Link href="/help" className="hover:text-white/60 transition">GitHub</Link>
            </div>
          </footer>
        </motion.div>
      </section>
    </main>
  );
}

function Navbar() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl font-heading italic">ET InvestIQ</span>
          <span className="text-emerald-400 text-xs">●</span>
        </div>

        <div className="liquid-glass rounded-full px-2 py-2 flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/80 px-4 py-1.5 rounded-full hover:bg-white/10 transition font-body"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/xray"
          className="liquid-glass-strong rounded-full text-sm font-medium text-white px-5 py-2 inline-flex items-center gap-2 font-body"
        >
          Launch App <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[900px] h-screen bg-black">
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-[-8%] bg-[radial-gradient(circle_at_20%_25%,rgba(16,185,129,0.28),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(6,95,70,0.3),transparent_50%)] animate-[mesh-float_12s_ease-in-out_infinite]" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="none">
          <path d="M0,620 C180,560 320,700 510,630 C690,560 760,360 940,410 C1120,460 1260,690 1600,560" fill="none" stroke="rgba(74,222,128,0.4)" strokeWidth="4" />
          <path d="M0,680 C260,600 420,720 640,650 C880,575 1030,420 1250,510 C1390,570 1490,620 1600,600" fill="none" stroke="rgba(20,184,166,0.35)" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-black/20 z-[1]" />
      <div className="absolute bottom-0 left-0 right-0 z-[2] h-[350px] bg-gradient-to-b from-transparent to-black" />

      <div className="relative z-10 text-center pt-40 px-6 max-w-6xl mx-auto">
        <motion.span
          className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.7, ease: "easeOut" }}
        >
          🇮🇳 Built for Indian Retail Investors
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <BlurText
            text="Invest Smarter. See Further. Win Bigger."
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.85] tracking-[-3px]"
            delayPerWord={100}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
          className="text-white/60 font-body font-light text-lg max-w-xl mx-auto mt-6"
        >
          Portfolio diagnostics. Opportunity radar. Market intelligence. All powered by AI. Built for the Indian market.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: "easeOut" }}
          className="flex flex-wrap gap-4 justify-center mt-10"
        >
          <Link
            href="/xray"
            className="liquid-glass-strong rounded-full text-white font-body font-medium px-6 py-3 inline-flex items-center gap-2"
          >
            Analyse My Portfolio <ArrowUpRight className="w-4 h-4" />
          </Link>
          <button className="text-white/60 hover:text-white inline-flex items-center gap-2 text-sm font-body font-light transition">
            <Play className="w-4 h-4" /> Watch Demo
          </button>
        </motion.div>
      </div>

      <div className="absolute bottom-20 left-0 right-0 z-10 px-6">
        <div className="liquid-glass py-2 overflow-hidden whitespace-nowrap">
          <div className="inline-flex w-[200%] animate-[ticker_30s_linear_infinite]">
            {[0, 1].map((copy) => (
              <div key={copy} className="inline-flex min-w-[50%] items-center gap-8 px-8">
                {tickerItems.map(([symbol, move]) => {
                  const up = move.startsWith("+");
                  return (
                    <span key={`${copy}-${symbol}`} className="font-body text-xs font-medium text-white/80">
                      {symbol} <span className={up ? "text-emerald-400" : "text-red-400"}>{up ? "▲" : "▼"} {move.replace("+", "")}</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="w-full min-h-[700px] py-32 px-6 md:px-16 lg:px-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.06]">
        <svg className="w-full h-full" viewBox="0 0 1600 700" preserveAspectRatio="none">
          <path d="M0,480 L1600,330" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M40,500 L260,460 L320,490 L450,420 L570,440 L670,360 L820,390 L910,320 L1040,360 L1140,300 L1300,340 L1540,280" stroke="rgba(74,222,128,0.9)" strokeWidth="3" fill="none" />
          <path d="M20,560 L180,520 L280,550 L460,500 L560,520 L730,470 L860,500 L980,460 L1100,490 L1260,430 L1380,450 L1580,420" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" />
        </svg>
      </div>
      <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-black to-transparent z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black to-transparent z-[1]" />

      <motion.div className="relative z-10 centered max-w-3xl mx-auto text-center" {...sectionMotion}>
        <span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4">How It Works</span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
          You share. We analyse. You invest.
        </h2>
        <p className="text-white/60 font-body font-light text-sm mt-5 max-w-2xl mx-auto">
          Upload your portfolio or pick a stock. Our AI cross-references live feeds, SEBI alerts, bulk deals, and chart patterns - then explains exactly what it means for you.
        </p>
        <Link href="/xray" className="mt-7 inline-flex items-center gap-2 liquid-glass-strong rounded-full px-5 py-2.5 text-sm text-white font-body font-medium">
          Try Portfolio X-Ray <ArrowUpRight className="w-4 h-4" />
        </Link>

        <div className="mt-16 flex flex-wrap gap-8 justify-center">
          {[
            ["01", "Upload or Connect", "Drop your CAS PDF or enter a ticker. Instant ingestion."],
            ["02", "AI Cross-References", "Live BSE, NSE, SEBI feeds + chart patterns + portfolio context."],
            ["03", "Actionable Clarity", "Health score, rebalancing actions, signals - explained in plain English."],
          ].map(([num, title, desc]) => (
            <div key={num} className="liquid-glass rounded-2xl p-6 text-center max-w-xs">
              <p className="text-4xl font-heading italic text-white/20">{num}</p>
              <p className="text-lg font-heading italic text-white mt-2">{title}</p>
              <p className="text-white/60 text-sm font-body font-light mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function XrayVisual() {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-white font-body text-sm">Portfolio Snapshot</p>
        <p className="text-emerald-400 text-xs font-body">Healthy</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {[
            ["Large Cap", 42],
            ["Flexi Cap", 25],
            ["Index", 18],
            ["Small Cap", 15],
          ].map(([name, val]) => (
            <div key={String(name)}>
              <div className="flex justify-between text-xs text-white/70 font-body mb-1"><span>{name}</span><span>{val}%</span></div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div style={{ width: `${val}%` }} className="h-full bg-emerald-400" /></div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border border-emerald-400/50 flex items-center justify-center text-center">
            <div>
              <p className="text-3xl font-heading italic text-emerald-300">84</p>
              <p className="text-[10px] text-white/55 font-body">/ 100</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RadarVisual() {
  return (
    <div className="liquid-glass rounded-2xl p-6 space-y-3">
      {["Bulk Deal", "SEBI Update", "Breakout"].map((type, idx) => (
        <div key={type} className="liquid-glass rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/75 font-body uppercase tracking-wide">{type}</span>
            <span className="text-[10px] text-emerald-400 font-body">BSE</span>
          </div>
          <p className="text-sm text-white font-body">{["TATASTEEL", "ICICIBANK", "INFY"][idx]}</p>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${78 - idx * 10}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="liquid-glass rounded-2xl p-6 space-y-3">
      <div className="ml-auto max-w-[75%] rounded-2xl bg-white/10 px-4 py-2 text-sm text-white font-body">Should I hold HDFC Bank?</div>
      <div className="max-w-[85%] rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80 font-body leading-relaxed">
        Data suggests hold with staggered accumulation near support. Risk: private bank earnings sensitivity to funding cost.
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="liquid-glass rounded-full px-2 py-1 text-[10px] text-white/70 font-body">NSE Filing</span>
        <span className="liquid-glass rounded-full px-2 py-1 text-[10px] text-white/70 font-body">Yahoo Quote</span>
      </div>
    </div>
  );
}

function ChartVisual() {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      <div className="h-36 flex items-end gap-1.5 mb-3">
        {[18, 34, 26, 45, 28, 52, 32, 58, 40, 62, 48].map((h, i) => (
          <div key={i} className={`w-4 rounded-sm ${i % 2 === 0 ? "bg-emerald-400/80" : "bg-red-400/70"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <span className="liquid-glass rounded-full px-3 py-1 text-xs text-emerald-300 font-body inline-block">
        Bullish Engulfing - 72% confidence
      </span>
    </div>
  );
}

function NewbieVisual() {
  return (
    <div className="liquid-glass rounded-2xl p-6 space-y-3">
      <div className="liquid-glass rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-wide text-white/50 font-body mb-1">Front</p>
        <p className="text-white font-heading italic text-2xl">What is XIRR?</p>
      </div>
      <div className="liquid-glass rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-wide text-white/50 font-body mb-1">Back</p>
        <p className="text-sm text-white/75 font-body">XIRR is annualized return accounting for irregular cash flows over time.</p>
        <span className="mt-2 inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-1 text-[10px] font-body">Action: Compare fund XIRRs</span>
      </div>
    </div>
  );
}
