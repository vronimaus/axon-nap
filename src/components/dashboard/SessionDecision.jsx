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
    borderColor: 'border-amber-500/40',
    bgColor: 'from-amber-500/10 to-transparent',
    accentColor: 'text-amber-400',
    barColor: 'bg-amber-500',
    dot: 'bg-amber-400',
  },
  rehab_override: {
    icon: Activity,
    borderColor: 'border-blue-500/40',
    bgColor: 'from-blue-500/10 to-transparent',
    accentColor: 'text-blue-400',
    barColor: 'bg-blue-500',
    dot: 'bg-blue-400',
  },
  rehab_first: {
    icon: AlertTriangle,
    borderColor: 'border-amber-500/40',
    bgColor: 'from-amber-500/10 to-transparent',
    accentColor: 'text-amber-400',
    barColor: 'bg-amber-500',
    dot: 'bg-amber-400 animate-pulse',
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
    borderColor: 'border-cyan-500/40',
    bgColor: 'from-cyan-500/10 to-transparent',
    accentColor: 'text-cyan-400',
    barColor: 'bg-cyan-500',
    dot: 'bg-cyan-400',
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
      <div className="glass rounded-xl border border-slate-700 p-4 flex items-center gap-3">
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
      className={`glass rounded-xl border ${cfg.borderColor} p-4 sm:p-5 bg-gradient-to-r ${cfg.bgColor}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-2 h-2 rounded-full ${cfg.dot} mt-2 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Heutige Session</p>
          <h3 className={`text-base sm:text-lg font-bold ${cfg.accentColor}`}>{data.title}</h3>
        </div>
        <Icon className={`w-5 h-5 ${cfg.accentColor} flex-shrink-0 mt-0.5`} />
      </div>

      {/* Reason */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-1">{data.reason}</p>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">{data.recommendation}</p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => window.location.href = createPageUrl(data.cta.page)}
          size="sm"
          className={`gap-2 text-xs sm:text-sm bg-gradient-to-r ${
            data.decision === 'training' ? 'from-amber-500/30 to-yellow-500/30 border border-amber-500/40 text-amber-300 hover:from-amber-500/40' :
            data.decision === 'rest' ? 'from-slate-500/30 to-slate-600/30 border border-slate-500/40 text-slate-300 hover:from-slate-500/40' :
            data.decision === 'no_plan' ? 'from-cyan-500/30 to-blue-500/30 border border-cyan-500/40 text-cyan-300 hover:from-cyan-500/40' :
            'from-blue-500/30 to-cyan-500/30 border border-blue-500/40 text-blue-300 hover:from-blue-500/40'
          }`}
        >
          {data.cta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>

        {data.secondary_cta && (
          <Button
            onClick={() => window.location.href = createPageUrl(data.secondary_cta.page)}
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm text-slate-400 hover:text-slate-200"
          >
            {data.secondary_cta.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
}