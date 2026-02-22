import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

export default function SessionDecision({ user }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessionDecision', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('sessionGenerator', {});
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="glass rounded-xl border border-slate-700 p-3 flex items-center justify-center gap-3">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
        <span className="text-sm text-slate-400">AXON analysiert deinen Status...</span>
      </div>
    );
  }

  if (isError || !data) return null;

  const cfg = CONFIG[data.decision] || CONFIG.no_plan;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass rounded-xl border ${cfg.borderColor} p-3 sm:p-4 bg-gradient-to-r ${cfg.bgColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg`}
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 rounded-full bg-slate-900 border ${cfg.borderColor} flex items-center justify-center flex-shrink-0 shadow-inner`}>
          <Icon className={`w-5 h-5 ${cfg.accentColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heutige Empfehlung</span>
          </div>
          <h3 className={`text-sm sm:text-base font-bold ${cfg.accentColor}`}>{data.title}</h3>
          <p className="text-xs text-slate-300 mt-1 line-clamp-1 sm:line-clamp-2">{data.recommendation}</p>
        </div>
      </div>
      
      <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        <Button
          onClick={() => window.location.href = createPageUrl(data.cta.page)}
          size="sm"
          className={`w-full sm:w-auto gap-2 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border ${cfg.borderColor} ${cfg.accentColor}`}
        >
          {data.cta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}