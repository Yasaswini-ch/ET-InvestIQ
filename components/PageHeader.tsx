"use client";

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1 font-display">{title}</h1>
        {description && (
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
