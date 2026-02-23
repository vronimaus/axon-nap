import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Play, Zap, Activity, Moon, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

// Triage → welche Routinen passen
const TRIAGE_ROUTINE_MAP = {
  training: ['Neural Primer', 'Pre-Session Power-Up', 'Posterior Chain Activation'],
  rehab_override: ['Joint Integrity Protocol', 'MFR Faszien-Release (Oberkörper)', 'Structural Reset (Unterkörper)', 'Vagus Reset'],
  rehab_first: ['Joint Integrity Protocol', 'MFR Faszien-Release (Oberkörper)', 'Structural Reset (Unterkörper)'],
  rest: ['Deep Recovery Protocol', 'Vagus Reset', 'Morning System Reboot'],
  no_plan: ['Morning System Reboot', 'Neural Primer'],
};

const TRIAGE_LABELS = {
  training: { label: 'Für dein Training heute', icon: Zap, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'from-blue-500/10' },
  rehab_override: { label: 'Für dein Reha-Protokoll heute', icon: Activity, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'from-emerald-500/10' },
  rehab_first: { label: 'Stabilisierung vor dem Training', icon: Activity, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'from-emerald-500/10' },
  rest: { label: 'Aktive Regeneration heute', icon: Moon, color: 'text-slate-300', border: 'border-slate-500/30', bg: 'from-slate-500/10' },
  no_plan: { label: 'Empfohlen für den Einstieg', icon: Star, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/10' },
};

const CATEGORY_LABELS = {
  neuro: 'Neuro',
  mobility: 'Mobilität',
  breathwork: 'Atemarbeit',
  faszien: 'Faszien',
  'funktionale-bewegung': 'Bewegung',
};

const INTENSITY_LABELS = {
  low: { label: 'Sanft', color: 'text-green-400' },
  medium: { label: 'Moderat', color: 'text-amber-400' },
  high: { label: 'Intensiv', color: 'text-red-400' },
};

export default function FlowRoutines() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) { window.location.href = createPageUrl('Landing'); return; }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list(),
    enabled: !!user,
  });

  const { data: sessionData } = useQuery({
    queryKey: ['sessionDecision', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('sessionGenerator', {});
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: completionHistory = [] } = useQuery({
    queryKey: ['routineHistory', user?.email],
    queryFn: () => base44.entities.RoutineHistory.filter({ created_by: user.email }, '-created_date', 20),
    enabled: !!user?.email,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const decision = sessionData?.decision || 'no_plan';
  const triageConfig = TRIAGE_LABELS[decision] || TRIAGE_LABELS.no_plan;
  const TriageIcon = triageConfig.icon;

  const recommendedNames = TRIAGE_ROUTINE_MAP[decision] || [];
  const recommendedRoutines = routines.filter(r => recommendedNames.includes(r.routine_name));
  const otherRoutines = routines.filter(r => !recommendedNames.includes(r.routine_name));

  const completedIds = new Set(completionHistory.map(h => h.routine_id));

  const navigateToRoutine = (routine) => {
    window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 md:pb-8">
      <Helmet>
        <title>Flow Routines – AXON</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">FLOW</h1>
            <p className="text-xs text-slate-400 mt-0.5">Tägliche Systempflege</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Triage Banner */}
        {sessionData && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-xl border ${triageConfig.border} p-4 bg-gradient-to-r ${triageConfig.bg} to-transparent`}
          >
            <div className="flex items-center gap-3">
              <TriageIcon className={`w-5 h-5 flex-shrink-0 ${triageConfig.color}`} />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">AXON empfiehlt</p>
                <p className={`font-semibold text-sm ${triageConfig.color}`}>{triageConfig.label}</p>
              </div>
            </div>
            {sessionData.reason && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sessionData.reason}</p>
            )}
          </motion.div>
        )}

        {/* Recommended Routines */}
        {recommendedRoutines.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Heute für dich
            </h2>
            <div className="space-y-3">
              {recommendedRoutines.map((routine, idx) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  idx={idx}
                  completed={completedIds.has(routine.id)}
                  highlighted
                  onClick={() => navigateToRoutine(routine)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Explore Routines */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Entdecken
          </h2>
          
          {/* Category Filter */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all', label: 'Alle' },
              { id: 'funktionale-bewegung', label: 'Functional' },
              { id: 'mobility', label: 'Mobility' },
              { id: 'neuro', label: 'Neuro' },
              { id: 'faszien', label: 'Faszien' },
              { id: 'breathwork', label: 'Atmung' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {routines
              .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
              .map((routine, idx) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                idx={idx}
                completed={completedIds.has(routine.id)}
                onClick={() => navigateToRoutine(routine)}
              />
            ))}
            
            {routines.filter(r => selectedCategory === 'all' || r.category === selectedCategory).length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm glass rounded-xl border border-slate-700/50">
                Keine Routinen in dieser Kategorie gefunden.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function RoutineCard({ routine, idx, completed, highlighted, onClick }) {
  const intensity = INTENSITY_LABELS[routine.intensity_level] || { label: 'Sanft', color: 'text-green-400' };
  const categoryLabel = CATEGORY_LABELS[routine.category] || routine.category;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className={`w-full text-left glass rounded-xl border transition-all group ${
        highlighted
          ? 'border-cyan-500/30 hover:border-cyan-500/60'
          : 'border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
          highlighted ? 'bg-slate-800' : 'bg-slate-800/50'
        }`}>
          {routine.icon || '⚡'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-sm leading-snug ${highlighted ? 'text-white' : 'text-slate-200'}`}>
              {routine.routine_name}
            </h3>
            {completed && (
              <span className="text-xs text-green-400 flex-shrink-0">✓ Erledigt</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {routine.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {routine.total_duration} Min.
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{categoryLabel}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className={`text-xs ${intensity.color}`}>{intensity.label}</span>
          </div>
        </div>

        {/* Arrow */}
        <Play className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}