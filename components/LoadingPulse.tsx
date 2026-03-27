'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingPulseProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingPulse({ 
  message = "Analyzing...", 
  subMessage 
}: LoadingPulseProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-full border-4 border-[#E8651A]/20" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Loader2 className="w-16 h-16 text-[#E8651A]" />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-[#111827] font-medium"
      >
        {message}
      </motion.p>

      {subMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-[#6B7280] text-sm"
        >
          {subMessage}
        </motion.p>
      )}

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full bg-[#E8651A]"
          />
        ))}
      </div>
    </div>
  );
}
