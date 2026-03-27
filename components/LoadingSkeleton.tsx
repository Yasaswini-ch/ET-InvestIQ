'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'chart' | 'full';
  count?: number;
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  if (type === 'full') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="relative w-16 h-16"
        >
          <div className="absolute inset-0 rounded-full border-4 border-[#E8DDD2]" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#E8651A] border-r-transparent border-b-transparent border-l-transparent" />
        </motion.div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-[#111827] mb-1">Analysing your portfolio</h3>
          <p className="text-sm text-[#6B7280]">Extracting fund details · Calculating XIRR · Checking overlaps</p>
        </div>
        <div className="w-56 h-1.5 bg-[#E8DDD2] rounded-full overflow-hidden">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 bg-[#E8651A] rounded-full"
          />
        </div>
      </div>
    );
  }

  const CardSkeleton = () => (
    <div className="bg-white rounded-xl border border-[#E8DDD2] p-4 shimmer">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#F7F0E8] rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-[#F7F0E8] rounded w-3/4" />
          <div className="h-2.5 bg-[#F7F0E8] rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="bg-white rounded-xl border border-[#E8DDD2] overflow-hidden">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-7 h-7 bg-[#F7F0E8] rounded shimmer" />
            <div className="flex-1 h-9 bg-[#F7F0E8] rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className="bg-white rounded-xl border border-[#E8DDD2] p-5 shimmer">
      <div className="h-3.5 bg-[#F7F0E8] rounded w-1/3 mb-5" />
      <div className="h-44 bg-[#F7F0E8] rounded-lg" />
    </div>
  );

  const SkeletonComponent = type === 'table' ? TableSkeleton : type === 'chart' ? ChartSkeleton : CardSkeleton;

  return (
    <div className={`grid gap-4 ${type === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
