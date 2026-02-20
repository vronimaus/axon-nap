import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, TrendingDown, Wind, Target, Lightbulb, Star, CheckCircle2, Timer, RotateCcw, Flame } from 'lucide-react';
import OuchInterventionModal from './OuchInterventionModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExerciseCard({ exercise, idx, readinessStatus, rehabPlan, queryClient, onFeedbackSubmit }) {
  const [fullExercise, setFullExercise] = useState(exercise);
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activeVariant, setActiveVariant] = useState('standard');
  const [satzCounter, setSatzCounter] = useState(1);
  const [satzDone, setSatzDone] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (exercise.exercise_id) {
      base44.entities.Exercise.filter({ exercise_id: exercise.exercise_id })
        .then(results => {
          if (results?.length > 0) {
            const dbEx = results[0];
            setFullExercise({
              ...exercise,
              ...dbEx,
              sets_reps_tempo: exercise.sets_reps_tempo || dbEx.sets_reps_tempo,
            });
          }
        })
        .catch(() => {});
    }
  }, [exercise.exercise_id]);

  // Parse sets_reps_tempo into parts
  const parseSpecs = (raw) => {
    if (!raw) return [];
    // Matches patterns like "3x10", "3×10", "2x60 Sek", "Langsam (3s)", etc.
    const parts = raw.split(/[·|]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
    // Try to split by common separators
    const segments = raw.split(/,\s*(?=\d)/).map(p => p.trim()).filter(Boolean);
    return segments.length > 1 ? segments : [raw];
  };

  const specParts = parseSpecs(fullExercise.sets_reps_tempo);

  const specIcons = [
    <Flame key="fire" className="w-3.5 h-3.5 text-orange-400" />,
    <RotateCcw key="rep" className="w-3.5 h-3.5 text-cyan-400" />,
    <Timer key="time" className="w-3.5 h-3.5 text-yellow-400" />,
  ];
  const specColors = [
    'border-orange-500/50 text-orange-300',
    'border-cyan-500/50 text-cyan-300',
    'border-yellow-500/50 text-yellow-300',
  ];

  const allInstructionLines = (fullExercise.description || fullExercise.instruction || '')
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0);

  const hasBasic = !!fullExercise.progression_basic?.description;
  const hasAdvanced = !!fullExercise.progression_advanced?.description;

  const variantContent = activeVariant === 'basic'
    ? fullExercise.progression_basic
    : activeVariant === 'advanced'
    ? fullExercise.progression_advanced
    : null;

  const totalSaetze = (() => {
    const raw = fullExercise.sets_reps_tempo || '';
    const m = raw.match(/^(\d+)[x×]/);
    return m ? parseInt(m[1]) : 3;
  })();

  const handleSatzFertig = () => {
    if (satzCounter < totalSaetze) {
      setSatzCounter(prev => prev + 1);
      toast.success(`Satz ${satzCounter} ✓ — Kurze Pause, dann weiter!`);
    } else {
      setSatzDone(true);
      toast.success('🎉 Alle Sätze geschafft!');
      if (onFeedbackSubmit) {
        onFeedbackSubmit({ exerciseId: fullExercise.exercise_id, metricValue: 5, notes: 'Completed' });
      }
    }
  };

  const handlePerformanceBoost = async () => {
    if (!fullExercise.next_progression_id) {
      toast.info('Kein Upgrade-Pfad definiert.');
      return;
    }
    setIsUpgrading(true);
    try {
      const { data } = await base44.functions.invoke('performanceBoost', {
        rehabPlanId: rehabPlan.id,
        exerciseId: fullExercise.exercise_id,
        currentPhaseIndex: (rehabPlan.current_phase || 1) - 1
      });
      if (data?.blocked) {
        toast.error(data.reason || 'Upgrade nicht möglich');
      } else if (data?.success) {
        toast.success(data.message || '🚀 Übung upgraded!', { duration: 5000 });
        if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }
    } catch {
      toast.error('Fehler beim Upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="rounded-2xl overflow-hidden border border-slate-600/60"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)' }}
    >
      {/* ── TOP: Nummer + Titel + Subtitle ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-center mb-4">
          <p className="text-orange-400 font-bold text-sm tracking-widest uppercase mb-1">
            #{idx + 1} {fullExercise.category ? `· ${fullExercise.category}` : ''}
            {fullExercise.stecco_chain ? ` · ${fullExercise.stecco_chain}` : ''}
          </p>
          <h3 className="text-2xl font-extrabold text-white leading-tight tracking-tight">
            {fullExercise.name}
          </h3>
          {fullExercise.difficulty && (
            <p className="text-slate-400 text-sm mt-1 capitalize">{fullExercise.difficulty}</p>
          )}
        </div>

        {/* ── SPEC PILLS ── */}
        {specParts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {specParts.map((part, i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold bg-slate-900/80 ${specColors[i % specColors.length]}`}
              >
                {specIcons[i % specIcons.length]}
                {part}
              </div>
            ))}
          </div>
        )}

        {/* ── VARIANT TABS ── */}
        {(hasBasic || hasAdvanced) && (
          <div className="flex justify-center gap-2 mb-4">
            {hasBasic && (
              <button
                onClick={() => setActiveVariant(activeVariant === 'basic' ? 'standard' : 'basic')}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                  activeVariant === 'basic'
                    ? 'bg-green-500/25 border-green-500/60 text-green-300'
                    : 'border-slate-600 text-slate-500 hover:text-green-400'
                }`}
              >
                <TrendingDown className="w-3 h-3" /> Basic
              </button>
            )}
            <button
              onClick={() => setActiveVariant('standard')}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                activeVariant === 'standard'
                  ? 'bg-orange-500/25 border-orange-500/60 text-orange-300'
                  : 'border-slate-600 text-slate-500 hover:text-orange-400'
              }`}
            >
              Standard
            </button>
            {hasAdvanced && (
              <button
                onClick={() => setActiveVariant(activeVariant === 'advanced' ? 'standard' : 'advanced')}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                  activeVariant === 'advanced'
                    ? 'bg-purple-500/25 border-purple-500/60 text-purple-300'
                    : 'border-slate-600 text-slate-500 hover:text-purple-400'
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Advanced
              </button>
            )}
          </div>
        )}

        {/* ── VARIANT CONTENT ── */}
        <AnimatePresence>
          {variantContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 rounded-xl p-3 border ${
                activeVariant === 'basic'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-purple-500/10 border-purple-500/30'
              }`}
            >
              {variantContent.label && (
                <p className={`text-xs font-bold mb-1 ${activeVariant === 'basic' ? 'text-green-400' : 'text-purple-400'}`}>
                  {variantContent.label}
                </p>
              )}
              <p className="text-sm text-slate-300 leading-snug">{variantContent.description}</p>
              {variantContent.focus && (
                <p className={`text-xs mt-1.5 ${activeVariant === 'basic' ? 'text-green-400/70' : 'text-purple-400/70'}`}>
                  Fokus: {variantContent.focus}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ANLEITUNG (Bullet-Style) ── */}
        {allInstructionLines.length > 0 && (
          <div className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
            <ul className="space-y-2">
              {allInstructionLines.map((line, i) => (
                <li key={i} className="text-sm text-slate-200 flex gap-2 leading-snug">
                  <span className="text-cyan-400 flex-shrink-0 font-bold">•</span>
                  <span dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── AXON-MOMENT (goldener Highlight) ── */}
        {fullExercise.axon_moment && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{
              background: 'rgba(250, 200, 50, 0.08)',
              border: '1.5px solid rgba(250, 200, 50, 0.35)',
              boxShadow: '0 0 18px rgba(250,200,50,0.08)'
            }}
          >
            <p className="text-sm leading-relaxed">
              <span className="font-bold" style={{ color: '#f5c842' }}>💡 AXON-Moment: </span>
              <span className="text-slate-200 italic">"{fullExercise.axon_moment}"</span>
            </p>
          </div>
        )}

        {/* ── DETAILS TOGGLE ── */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          {showDetails ? '▲ Weniger' : '▼ Cues, Benefits & Atmung'}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {fullExercise.cues?.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Ausführungs-Cues
                  </p>
                  <ul className="space-y-1">
                    {fullExercise.cues.map((cue, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-purple-400 flex-shrink-0">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fullExercise.benefits && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-bold text-green-400 mb-1">✨ Benefits</p>
                  <p className="text-sm text-slate-300">{fullExercise.benefits}</p>
                </div>
              )}
              {fullExercise.breathing_instruction && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Atmung
                  </p>
                  <p className="text-sm text-slate-300">{fullExercise.breathing_instruction}</p>
                </div>
              )}
              {(fullExercise.goal_explanation || fullExercise.purpose_explanation) && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-bold text-orange-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Warum diese Übung?
                  </p>
                  <p className="text-sm text-slate-300">{fullExercise.goal_explanation || fullExercise.purpose_explanation}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER: Ouch + Boost + Satz-Button ── */}
      <div className="px-4 pb-4 space-y-2">
        {/* Ouch & Boost nebeneinander */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsOuchModalOpen(true)}
            className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1.5px solid rgba(239,68,68,0.5)',
              color: '#f87171'
            }}
          >
            🔴 Ouch! (Hilfe)
          </button>
          <button
            onClick={handlePerformanceBoost}
            disabled={isUpgrading}
            className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'rgba(234,179,8,0.12)',
              border: '1.5px solid rgba(234,179,8,0.4)',
              color: '#fbbf24'
            }}
          >
            <Star className="w-4 h-4" />
            {isUpgrading ? 'Lädt...' : 'Zu einfach? (Boost)'}
          </button>
        </div>

        {/* Satz-Button */}
        {!satzDone ? (
          <button
            onClick={handleSatzFertig}
            className="w-full h-14 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(34,197,94,0.3)'
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            SATZ {satzCounter} FERTIG {satzCounter < totalSaetze ? `(Start Timer)` : '✓'}
          </button>
        ) : (
          <div
            className="w-full h-14 rounded-xl font-extrabold text-base flex items-center justify-center gap-2"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1.5px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            Alle {totalSaetze} Sätze erledigt! 🎉
          </div>
        )}
      </div>

      {/* Ouch Modal */}
      <OuchInterventionModal
        isOpen={isOuchModalOpen}
        onClose={() => setIsOuchModalOpen(false)}
        exerciseId={fullExercise.exercise_id}
        exerciseName={fullExercise.name}
        rehabPlanId={rehabPlan?.id}
        onExerciseSubstituted={() => {
          if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
        }}
      />
    </motion.div>
  );
}