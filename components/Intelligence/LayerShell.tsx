"use client";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface LayerShellProps {
  layerNumber: 1 | 2 | 3;
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  isLoading: boolean;
  children: ReactNode;
}

export default function LayerShell({
  layerNumber,
  label,
  title,
  description,
  icon,
  isExpanded,
  onToggle,
  isLoading,
  children
}: LayerShellProps) {
  
  const borders = {
    1: "border-l-2 border-l-blue-500/50",
    2: "border-l-2 border-l-amber-500/50",
    3: "border-l-2 border-l-emerald-500/50"
  };

  const badgeTexts = {
    1: "text-blue-500",
    2: "text-amber-500",
    3: "text-emerald-500"
  };

  return (
    <div className={`w-full liquid-glass rounded-2xl overflow-hidden transition-colors hover:bg-white/[0.02] border border-white/5 ${borders[layerNumber]}`}>
      {/* Header section always visible */}
      <div 
        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="liquid-glass-strong rounded-full w-8 h-8 flex items-center justify-center shrink-0">
            <span className={`font-body text-xs font-bold ${badgeTexts[layerNumber]}`}>L{layerNumber}</span>
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">{label}</span>
             </div>
             <h3 className="text-xl md:text-2xl text-white font-display font-medium tracking-tight mb-1">{title}</h3>
             <p className="text-white/60 text-sm leading-relaxed max-w-3xl">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
           {!isExpanded && (
             <span className="text-white/70 text-sm font-medium hover:text-white transition-colors">
               Analyse →
             </span>
           )}
           {isExpanded && (
             <span className="text-white/50 text-xs font-medium hover:text-white transition-colors">
               Collapse
             </span>
           )}
           <motion.div
             animate={{ rotate: isExpanded ? 180 : 0 }}
             transition={{ duration: 0.3 }}
           >
             <ChevronDown className="w-5 h-5 text-white/40" />
           </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-6 border-t border-white/10">
               {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
