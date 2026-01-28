import React from 'react';
import { Clock } from 'lucide-react';

export default function DemoTimer({ formattedTime, isLoading }) {
  if (isLoading) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 backdrop-blur-xl">
      <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
      <span className="text-sm font-mono font-bold text-cyan-400">
        {formattedTime}
      </span>
      <span className="text-xs text-slate-400 ml-1">Demo</span>
    </div>
  );
}