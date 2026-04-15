import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Play, Zap, Activity, Moon, Star, ChevronRight, Wind, Layers, Link, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';
import BottomSheet from '../components/ui/BottomSheet';

// Triage → welche Routinen passen (deutsche Namen, passend zu DB)
const TRIAGE_ROUTINE_MAP = {
  training: ['Pre-Sport Aktivierung', 'Morgen-Erwachen'],
  rehab_override: ['Schreibtisch-Befreiung', 'Mittags-Reset', 'Abend Wind-Down'],
  rehab_first: ['Schreibtisch-Befreiung', 'Mittags-Reset'],
  rest: ['Abend Wind-Down', 'Tiefer Schlaf Prep'],
  no_plan: [],
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

const CATEGORY_ICONS = {
  neuro: Zap,
  mobility: Activity,
  breathwork: Wind,
  faszien: Layers,
  'funktionale-bewegung': Link,
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) { 
          window.location.href = createPageUrl('Landing'); 
          return; 
        }
        setUser(currentUser);
      } catch (e) {
        // Only redirect if it's an auth error, not other errors
        const status = e?.response?.status || e?.status;
        if (status === 401 || status === 403) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        // For other errors (network etc), still show the page if possible
        console.error('Auth check error:', e);
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
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  const decision = sessionData?.decision || 'no_plan';
  const triageConfig = TRIAGE_LABELS[decision] || TRIAGE_LABELS.no_plan;
  const TriageIcon = triageConfig.icon;

  // Tageszeit-basierte Empfehlung
  const hour = new Date().getHours();
  const getTimeBasedRoutines = () => {
    if (hour >= 5 && hour < 10) return ['Morgen-Erwachen'];
    if (hour >= 10 && hour < 15) return ['Mittags-Reset', 'Schreibtisch-Befreiung'];
    if (hour >= 15 && hour < 18) return ['Pre-Sport Aktivierung', 'Schreibtisch-Befreiung'];
    if (hour >= 18 && hour < 21) return ['Abend Wind-Down'];
    return ['Tiefer Schlaf Prep', 'Abend Wind-Down'];
  };

  // Tageszeit-basiert immer als Basis, triage ergänzt
  const timeBasedNames = getTimeBasedRoutines();
  const triageNames = TRIAGE_ROUTINE_MAP[decision] || [];
  const recommendedNames = [...new Set([...timeBasedNames, ...triageNames])];

  const recommendedRoutines = routines.filter(r => recommendedNames.includes(r.routine_name));
  const otherRoutines = routines.filter(r => !recommendedNames.includes(r.routine_name));

  const completedIds = new Set(completionHistory.map(h => h.routine_id));

  const navigateToRoutine = (routine) => {
    window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`);
  };

  return (
    <div className="min-h-screen bg-[#111111] pb-24 md:pb-8">
      <Helmet>
        <title>Flow Routines – AXON</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#111111] border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Flow</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Tägliche Systempflege</p>
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
            className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4"
          >
            <div className="flex items-center gap-3">
              <TriageIcon className="w-4 h-4 flex-shrink-0 text-zinc-400" />
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">AXON empfiehlt</p>
                <p className="font-semibold text-sm text-zinc-200">{triageConfig.label}</p>
              </div>
            </div>
            {sessionData.reason && (
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{sessionData.reason}</p>
            )}
          </motion.div>
        )}

        {/* Recommended Routines */}
        {recommendedRoutines.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
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
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">
            Entdecken
          </h2>
          
          {/* Category Filter - mobile bottom sheet on small screens, pills on desktop */}
          <div className="flex items-center gap-2 mb-4">
            {/* Mobile filter button */}
            <button
              className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 border border-white/[0.06]"
              onClick={() => setFilterSheetOpen(true)}
            >
              <Filter className="w-3.5 h-3.5" />
              {selectedCategory === 'all' ? 'Alle Kategorien' : CATEGORY_LABELS[selectedCategory] || selectedCategory}
            </button>

            {/* Desktop pills */}
            <div className="hidden sm:flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
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
                      ? 'bg-zinc-200 text-zinc-900'
                      : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Bottom Sheet for category filter */}
          <BottomSheet isOpen={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title="Kategorie wählen">
            <div className="space-y-1 pb-4">
              {[
                { id: 'all', label: 'Alle Kategorien' },
                { id: 'funktionale-bewegung', label: 'Functional' },
                { id: 'mobility', label: 'Mobilität' },
                { id: 'neuro', label: 'Neuro' },
                { id: 'faszien', label: 'Faszien (MFR)' },
                { id: 'breathwork', label: 'Atemarbeit' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setFilterSheetOpen(false); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-zinc-700 text-white border border-white/[0.08]'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                  {selectedCategory === cat.id && <span className="text-zinc-300">✓</span>}
                </button>
              ))}
            </div>
          </BottomSheet>

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
              <div className="text-center py-8 text-zinc-500 text-sm rounded-xl border border-white/[0.06]">
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
  const intensity = INTENSITY_LABELS[routine.intensity_level] || { label: 'Sanft', color: 'text-zinc-500' };
  const categoryLabel = CATEGORY_LABELS[routine.category] || routine.category;
  const CategoryIcon = CATEGORY_ICONS[routine.category] || Activity;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all group bg-zinc-900/60 ${
        highlighted ? 'border-white/[0.1] hover:border-white/[0.15]' : 'border-white/[0.06] hover:border-white/[0.1]'
      }`}
    >
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-zinc-800 text-zinc-400">
          <CategoryIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug text-zinc-200">
              {routine.routine_name}
            </h3>
            {completed && (
              <span className="text-[10px] text-zinc-500 flex-shrink-0">Erledigt</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
            {routine.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              {routine.total_duration} Min.
            </span>
            <span className="text-xs text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{categoryLabel}</span>
            <span className="text-xs text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{intensity.label}</span>
          </div>
        </div>

        <Play className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}