import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto liquid-glass rounded-2xl p-8">
      <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">Support</p>
      <h1 className="text-2xl font-bold text-white mb-3">Need help with InvestIQ?</h1>
      <p className="text-sm text-white/60 leading-relaxed mb-6">
        Start with Market Intelligence for guided help, or run Portfolio X-Ray using sample data to verify your setup.
      </p>
      <div className="flex gap-3">
        <Link href="/chat" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all">
          Open Market Chat
        </Link>
        <Link href="/xray" className="px-4 py-2 rounded-lg liquid-glass text-sm font-bold text-white/80 hover:text-white transition-all">
          Open X-Ray
        </Link>
      </div>
    </div>
  );
}
