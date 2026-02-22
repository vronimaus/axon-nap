import React from 'react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Zap, Activity, Moon, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONFIG = {
  training: {
    icon: Zap,
    borderColor: 'border-blue-500/40',
    bgColor: 'from-blue-500/10 to-transparent',
    accentColor: 'text-blue-400',
    barColor: 'bg-blue-500',
    dot: 'bg-blue-400',
  },
  rehab_override: {
    icon: Activity,
    borderColor: 'border-emerald-500/40',
    bgColor: 'from-emerald-500/10 to-transparent',
    accentColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    dot: 'bg-emerald-400',
  },
  rehab_first: {
    icon: AlertTriangle,
    borderColor: 'border-emerald-500/40',
    bgColor: 'from-emerald-500/10 to-transparent',
    accentColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    dot: 'bg-emerald-400 animate-pulse',
  },
  rest: {
    icon: Moon,
    borderColor: 'border-slate-500/40',
    bgColor: 'from-slate-500/10 to-transparent',
    accentColor: 'text-slate-300',
    barColor: 'bg-slate-500',
    dot: 'bg-slate-400',
  },
  no_plan: {
    icon: Zap,
    borderColor: 'border-purple-500/40',
    bgColor: 'from-purple-500/10 to-transparent',
    accentColor: 'text-purple-400',
    barColor: 'bg-purple-500',
    dot: 'bg-purple-400',
  },
};

export default function SessionDecision({ user, data, onClick }) {
  if (!data) {
    return (
      <div className="glass rounded-xl border border-slate-700 p-3 flex items-center justify-center gap-3 relative z-10">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
        <span className="text-sm text-slate-400">AXON analysiert deinen Status...</span>
      </div>
    );
  }

  const cfg = CONFIG[data.decision] || CONFIG.no_plan;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={`group glass rounded-xl border ${cfg.borderColor} p-3 sm:p-4 bg-gradient-to-r ${cfg.bgColor} flex flex-row items-center justify-between gap-4 shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 rounded-full bg-slate-900 border ${cfg.borderColor} flex items-center justify-center flex-shrink-0 shadow-inner`}>
          <Icon className={`w-5 h-5 ${cfg.accentColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System-Status & Empfehlung</span>
          </div>
          <h3 className={`text-sm sm:text-base font-bold ${cfg.accentColor} flex items-center flex-wrap gap-2`}>
            {data.title} 
            {data.mcs !== undefined && data.mcs !== null && (
              <span className="text-xs font-normal text-slate-400">MCS: {data.mcs}%</span>
            )}
          </h3>
          <p className="text-xs text-slate-300 mt-1">{data.psychological_framing}</p>
          {onClick && (
            <p className="text-[10px] sm:text-xs text-cyan-400/80 mt-1.5 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3" /> Tippe für Sync-History & Bio-Daten
            </p>
          )}
          {data.benchmarkTransferMessage && (
            <p className="text-xs font-medium text-emerald-400 mt-2 bg-emerald-500/10 inline-block px-2 py-1 rounded">
              {data.benchmarkTransferMessage}
            </p>
          )}
        </div>
      </div>

      {onClick && (
        <div className="flex-shrink-0 hidden sm:flex items-center justify-center p-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${cfg.accentColor} flex items-center gap-1`}>
            Deep Data
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </motion.div>
  );
}