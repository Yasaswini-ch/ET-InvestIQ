"use client";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

interface ShareCardProps {
  investorName: string;
  healthScore: number;
  xirr: number;
  currentValue: number;
  alpha: number; // beat nifty by X%
}

export default function ShareCard({
  investorName,
  healthScore,
  xirr,
  currentValue,
  alpha,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function downloadCard() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#000000",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "my-portfolio-score.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  const scoreColor =
    healthScore >= 75
      ? "#10B981"
      : healthScore >= 50
        ? "#F59E0B"
        : "#EF4444";

  return (
    <div className="space-y-4">
      {/* The card that gets screenshotted */}
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #111118 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "28px",
          width: "400px",
          fontFamily: "Barlow, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <p style={{ color: "#64748b", fontSize: "11px", margin: 0 }}>
              ET InvestIQ
            </p>
            <p
              style={{
                color: "#f1f5f9",
                fontSize: "18px",
                fontWeight: 600,
                margin: "4px 0 0",
              }}
            >
              {investorName}&apos;s Portfolio
            </p>
          </div>
          <div
            style={{
              background: `${scoreColor}20`,
              border: `1px solid ${scoreColor}50`,
              borderRadius: "12px",
              padding: "8px 14px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: scoreColor,
                fontSize: "24px",
                fontWeight: 700,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {healthScore}
            </p>
            <p
              style={{
                color: `${scoreColor}99`,
                fontSize: "10px",
                margin: "4px 0 0",
              }}
            >
              Health Score
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              label: "Portfolio Value",
              value: `₹${(currentValue / 100000).toFixed(1)}L`,
            },
            { label: "Overall XIRR", value: `${xirr.toFixed(1)}%` },
            {
              label: "Beat Nifty",
              value: `+${alpha.toFixed(1)}%`,
              highlight: true,
            },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: "10px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: m.highlight ? "#10B981" : "#f1f5f9",
                  fontSize: "18px",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {m.value}
              </p>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "10px",
                  margin: "4px 0 0",
                }}
              >
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ color: "#334155", fontSize: "10px", margin: 0 }}>
            Not financial advice. For educational use only.
          </p>
          <p style={{ color: "#10B981", fontSize: "11px", margin: 0 }}>
            etinvestiq.vercel.app
          </p>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={downloadCard}
        disabled={generating}
        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium py-3 rounded-xl transition-colors text-sm"
      >
        {generating ? "Generating card..." : "📤 Download Share Card"}
      </button>
      <p className="text-slate-500 text-xs text-center">
        Share on WhatsApp, Twitter, or LinkedIn to show off your portfolio score
      </p>
    </div>
  );
}
