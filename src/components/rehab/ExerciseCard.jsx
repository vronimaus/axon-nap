import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Zap, Timer, RotateCcw, AlertCircle, Wind, Target, Lightbulb, TrendingUp, TrendingDown, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OuchInterventionModal from './OuchInterventionModal';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExerciseCard({ exercise, idx, readinessStatus, rehabPlan, queryClient, onFeedbackSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const [fullExercise, setFullExercise] = useState(exercise);
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activeVariant, setActiveVariant] = useState('standard'); // 'basic' | 'standard' | 'advanced'

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

  const handlePerformanceBoost = async () => {
    if (!fullExercise.next_progression_id) {
      toast.info('Kein Upgrade-Pfad definiert für diese Übung.');
      return;
    }
    setIsUpgrading(true);
    try {
      const { data } = await base44.functions.invoke('performanceBoost', {
        rehabPlanId: rehabPlan.id,
        exerciseId: fullExercise.exercise_id,
        currentPhaseIndex: (rehabPlan.current_phase || 1) - 1
      });
      if (data.blocked) {
        toast.error(data.reason || 'Upgrade nicht möglich');
      } else if (data.success) {
        toast.success(data.message || '🚀 Übung upgraded!', { duration: 5000 });
        if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
      }
    } catch (error) {
      toast.error('Fehler beim Upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const isStrengthExercise = fullExercise.category && ['strength', 'functional'].includes(fullExercise.category.toLowerCase());
  const shouldShowWarning = readinessStatus === 'yellow' && isStrengthExercise;

  // Get all instruction lines from description
  const allInstructionLines = (fullExercise.description || fullExercise.instruction || '')
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0);

  const specsRaw = fullExercise.sets_reps_tempo || '';
  const specsDisplay = shouldShowWarning ? `${specsRaw} → −50%` : specsRaw;

  // Variant content
  const variantContent = activeVariant === 'basic'
    ? fullExercise.progression_basic
    : activeVariant === 'advanced'
    ? fullExercise.progression_advanced
    : null;

  const hasBasic = !!fullExercise.progression_basic?.description;
  const hasAdvanced = !!fullExercise.progression_advanced?.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="glass rounded-2xl border border-slate-700 overflow-hidden flex flex-col"
    >
      {/* ── HEADER: Nummer + Titel + Kategorie ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
            shouldShowWarning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="font-bold text-white text-base leading-tight">{fullExercise.name}</h4>
              {fullExercise.category && (
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize">
                  {fullExercise.category}
                </span>
              )}
              {fullExercise.difficulty && (
                <span className={`text-xs rounded-full px-2 py-0.5 capitalize ${
                  fullExercise.difficulty === 'beginner' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                  fullExercise.difficulty === 'intermediate' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                  'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {fullExercise.difficulty}
                </span>
              )}
              {shouldShowWarning && (
                <span className="text-yellow-400 text-xs flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Reduzieren
                </span>
              )}
            </div>

            {/* Specs Pills */}
            {specsDisplay && (
              <div className="flex flex-wrap gap-2">
                {specsDisplay.split(/[×x@·|]/).map((part, i) => {
                  const icons = [
                    <RotateCcw key={0} className="w-3 h-3" />,
                    <Zap key={1} className="w-3 h-3" />,
                    <Timer key={2} className="w-3 h-3" />
                  ];
                  return (
                    <span key={i} className="flex items-center gap-1 text-xs font-semibold bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-2.5 py-1">
                      {icons[i] || null}
                      {part.trim()}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── VARIANT TABS (nur wenn Basic oder Advanced vorhanden) ── */}
      {(hasBasic || hasAdvanced) && (
        <div className="px-4 pb-3 flex gap-2">
          {hasBasic && (
            <button
              onClick={() => setActiveVariant(activeVariant === 'basic' ? 'standard' : 'basic')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                activeVariant === 'basic'
                  ? 'bg-green-500/20 border-green-500/40 text-green-300'
                  : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:text-green-400 hover:border-green-500/30'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Basic
            </button>
          )}
          <button
            onClick={() => setActiveVariant('standard')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
              activeVariant === 'standard'
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:text-orange-400'
            }`}
          >
            Standard
          </button>
          {hasAdvanced && (
            <button
              onClick={() => setActiveVariant(activeVariant === 'advanced' ? 'standard' : 'advanced')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                activeVariant === 'advanced'
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:text-purple-400 hover:border-purple-500/30'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Advanced
            </button>
          )}
        </div>
      )}

      {/* ── VARIANT CONTENT (wenn nicht Standard) ── */}
      <AnimatePresence>
        {variantContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mx-4 mb-3 rounded-xl p-3 border ${
              activeVariant === 'basic'
                ? 'bg-green-500/10 border-green-500/25'
                : 'bg-purple-500/10 border-purple-500/25'
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

      {/* ── ANLEITUNG (Standard) ── */}
      <div className="px-4 pb-3 space-y-3">
        {allInstructionLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">So geht's:</p>
            <ul className="space-y-1.5">
              {allInstructionLines.slice(0, expanded ? allInstructionLines.length : 3).map((line, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2 leading-snug">
                  <span className="text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {allInstructionLines.length > 3 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="mt-1 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <ChevronDown className="w-3 h-3" />
                +{allInstructionLines.length - 3} weitere Schritte
              </button>
            )}
          </div>
        )}

        {/* AXON-Moment – immer sichtbar */}
        {fullExercise.axon_moment && (
          <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-xl p-3">
            <p className="text-xs font-semibold text-cyan-400 mb-1">⚡ AXON-Moment</p>
            <p className="text-sm text-slate-300 leading-snug italic">{fullExercise.axon_moment}</p>
          </div>
        )}

        {/* Toggle für erweiterte Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Weniger anzeigen' : 'Details & Coaching'}
        </button>
      </div>

      {/* ── ERWEITERTE DETAILS ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/60 bg-slate-800/20"
          >
            <div className="px-4 py-4 space-y-3">

              {/* Purpose / Goal */}
              {(fullExercise.goal_explanation || fullExercise.purpose_explanation) && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Worum geht's?
                  </p>
                  <p className="text-sm text-slate-300 leading-snug">{fullExercise.goal_explanation || fullExercise.purpose_explanation}</p>
                </div>
              )}

              {/* Cues */}
              {fullExercise.cues?.length > 0 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Ausführungs-Tipps
                  </p>
                  <ul className="space-y-1">
                    {fullExercise.cues.map((cue, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2 leading-snug">
                        <span className="text-purple-400 flex-shrink-0">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {fullExercise.benefits && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs font-semibold text-green-400 mb-1">✨ Das bringt's dir</p>
                  <p className="text-sm text-slate-300 leading-snug">{fullExercise.benefits}</p>
                </div>
              )}

              {/* Breathing */}
              {fullExercise.breathing_instruction && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3" /> Atmung
                  </p>
                  <p className="text-sm text-slate-300 leading-snug">{fullExercise.breathing_instruction}</p>
                </div>
              )}

              {/* Yellow Warning */}
              {shouldShowWarning && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Moderate Belastung empfohlen
                  </p>
                  <p className="text-sm text-slate-300 leading-snug">
                    {fullExercise.modification_suggestions_yellow || 'Reduziere Intensität & Wiederholungen um 30–50%. Höre auf deinen Körper.'}
                  </p>
                </div>
              )}

              {/* Upgrade Info */}
              {fullExercise.next_progression_id && fullExercise.upgrade_boost_description && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-400 mb-1">🚀 Nächstes Level</p>
                  <p className="text-sm text-slate-300 leading-snug">{fullExercise.upgrade_boost_description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER: Ouch + I feel great ── */}
      <div className="border-t border-slate-700/60 px-4 py-3 bg-slate-900/60">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsOuchModalOpen(true)}
            className="flex-1 h-11 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 text-red-400 hover:text-red-300 gap-2 font-semibold text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            Ouch!
          </Button>
          <Button
            onClick={handlePerformanceBoost}
            disabled={isUpgrading || !fullExercise.next_progression_id}
            title={!fullExercise.next_progression_id ? 'Kein Upgrade-Pfad verfügbar' : 'Zu einfach? Upgrade!'}
            className={`flex-1 h-11 gap-2 font-semibold text-sm transition-all ${
              fullExercise.next_progression_id
                ? 'bg-green-500/15 border border-green-500/40 hover:bg-green-500/25 text-green-400 hover:text-green-300'
                : 'bg-slate-800/30 border border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Smile className="w-4 h-4" />
            {isUpgrading ? 'Lädt...' : 'I feel great!'}
          </Button>
        </div>
      </div>

      {/* Ouch Intervention Modal */}
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