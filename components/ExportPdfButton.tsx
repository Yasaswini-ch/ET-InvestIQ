"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";

export default function ExportPdfButton({ label = "Export PDF" }: { label?: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const timestamp = useMemo(() => new Date().toLocaleString("en-IN"), []);

  const handlePrint = () => {
    setIsPrinting(true);
    window.dispatchEvent(new CustomEvent("et-before-print"));
    document.querySelectorAll<HTMLElement>(".print-header").forEach((element) => {
      element.dataset.timestamp = timestamp;
    });
    window.setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-60"
    >
      <Printer className="w-4 h-4" />
      {isPrinting ? "Preparing PDF..." : label}
    </button>
  );
}

