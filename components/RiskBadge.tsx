'use client';

import { motion } from 'framer-motion';

type RiskType = 'aggressive' | 'moderate' | 'conservative';

interface RiskBadgeProps {
  profile: RiskType;
  size?: 'sm' | 'md' | 'lg';
}

const riskConfig = {
  aggressive: {
    color: 'bg-red-50 text-[#DC2626] border border-red-100',
    label: 'Aggressive',
    icon: '🔥',
  },
  moderate: {
    color: 'bg-yellow-50 text-[#D97706] border border-yellow-100',
    label: 'Moderate',
    icon: '⚖️',
  },
  conservative: {
    color: 'bg-green-50 text-[#059669] border border-green-100',
    label: 'Conservative',
    icon: '🛡️',
  }
};

export default function RiskBadge({ profile, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[profile];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-lg font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </motion.div>
  );
}
