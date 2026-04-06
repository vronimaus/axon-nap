import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Activity, Brain, Dumbbell, ArrowRight, Target } from 'lucide-react';

/**
 * AxonJourneyCard
 * Zeigt dem User die vollständige Kausalitätskette (If-When-Because-Outcome)
 * basierend auf den AxonScenario-Daten, die in der Phase gespeichert sind.
 */
export default function AxonJourneyCard({ phase }) {
  const [expanded, setExpanded] = useState(false);

  // Prüfe ob AXON-Daten vorhanden sind
  const hasAxonData =
    phase?.nms_shift_explanation ||
    phase?.synergy_highlight ||
    phase?.phase_rationale;

  if (!hasAxonData) return null;

  // NMS-Shift extrahieren (z.B. "stressed → balanced")
  const nmsShiftMatch = phase.nms_shift_explanation?.match(
    /(redline|stressed|solid|peak|vulnerable|sluggish|stuck|weak_pain|balanced|resilient|explosive|fluid|bulletproof)/gi
  );
  const nmsFrom = nmsShiftMatch?.[0] || null;
  const nmsTo = nmsShiftMatch?.[1] || null;

  const nmsColors = {
    redline: 'text-red-400 bg-red-500/10 border-red-500/30',
    stressed: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    vulnerable: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    sluggish: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    stuck: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    weak_pain: 'text-red-400 bg-red-500/10 border-red-500/30',
    balanced: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    solid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    resilient: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    explosive: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    fluid: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    bulletproof: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    peak: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  };

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 overflow-hidden">
      {/* Header – immer sichtbar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">AXON Kausalitätskette</p>
            {/* NMS-Shift Pill */}
            {nmsFrom && nmsTo && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${nmsColors[nmsFrom.toLowerCase()] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                  {nmsFrom}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${nmsColors[nmsTo.toLowerCase()] || 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'}`}>
                  {nmsTo}
                </span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Aufgeklappter Inhalt */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-800">

              {/* Das WARUM – NMS Shift Erklärung */}
              {phase.nms_shift_explanation && (
                <div className="pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" />
                    Das WARUM für diese Phase
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {phase.nms_shift_explanation}
                  </p>
                </div>
              )}

              {/* Synergie der Schritte */}
              {phase.synergy_highlight && (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Synergie: Warum die Schritte zusammen stärker wirken
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {phase.synergy_highlight}
                  </p>
                </div>
              )}

              {/* 3-Schritt Protokoll */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Dein 3-Schritt Protokoll dieser Phase
                </p>
                <div className="space-y-2">
                  {[
                    { step: '01', label: 'MFR (Hardware-Reset)', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                    { step: '02', label: 'Neuro-Drill (Software-Update)', icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                    { step: '03', label: 'Integration (Expertentraining)', icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                  ].map(({ step, label, icon: Icon, color, bg }) => (
                    <div key={step} className={`flex items-center gap-3 rounded-lg border p-3 ${bg}`}>
                      <span className={`text-[10px] font-mono font-bold ${color}`}>{step}</span>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-xs text-slate-300">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase Rationale */}
              {phase.phase_rationale && (
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1">Warum diese Dauer?</p>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    💡 {phase.phase_rationale}
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}