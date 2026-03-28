"use client";

import { Check } from "lucide-react";
import { BudgetAnnouncement } from "@/lib/types/intelligence";

type Props = {
  announcements: BudgetAnnouncement[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
};

export default function BudgetAnnouncementPicker({ announcements, selectedIds, onToggle, onSelectAll, onClear }: Props) {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-white/50";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-sm font-body">Choose one or more announcements to analyze</p>
        <div className="flex items-center gap-4 text-xs font-bold">
          <button onClick={onSelectAll} className="text-emerald-400 hover:underline" type="button">
            Select All
          </button>
          <button onClick={onClear} className="text-blue-400 hover:underline" type="button">
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {announcements.map((item) => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`liquid-glass rounded-xl px-4 py-3 cursor-pointer transition-all flex items-start gap-3 text-left w-full ${
                isSelected
                  ? "border border-blue-500/40 bg-blue-500/5 shadow-inner shadow-blue-500/10"
                  : "border border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getSeverityColor(item.severity)}`} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-sm font-body font-medium leading-tight">{item.title}</p>
                  <span className="liquid-glass rounded-full text-[10px] font-bold px-2 py-0.5 text-white/50 capitalize shrink-0">
                    {item.category.replace("_", " ")}
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">{item.shortText}</p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
