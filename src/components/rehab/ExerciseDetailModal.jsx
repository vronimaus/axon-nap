import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Activity, Dumbbell, Volume2, VolumeX, Loader2, Check, AlertCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTTS } from '@/hooks/useTTS';
import { base44 } from '@/api/base44Client';
import { Slider } from '@/components/ui/slider';
import OuchInterventionModal from './OuchInterventionModal';

// Maps exercise category to the correct AxonScenario causal field
const CATEGORY_CAUSAL_MAP = {
  mfr: { label: 'Mechanik (WARUM)', field: 'hardware_scientific_mechanism', icon: Activity, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  neuro: { label: 'Neurologie (WARUM)', field: 'software_scientific_mechanism', icon: Brain, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
  strength: { label: 'Integration (WARUM)', field: 'strength_scientific_mechanism', icon: Dumbbell, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  breath: { label: 'Mechanik (WARUM)', field: 'hardware_scientific_mechanism', icon: Activity, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  mobility: { label: 'Mechanik (WARUM)', field: 'hardware_scientific_mechanism', icon: Activity, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
};

const CATEGORY_LABEL = {
  mfr: 'MFR · Hardware-Reset',
  neuro: 'Neuro-Drill · Software-Update',
  breath: 'Atemarbeit',
  mobility: 'Mobilität',
  strength: 'Integration · Kraft',
};

export default function ExerciseDetailModal({
  exercise,
  isOpen,
  onClose,
  onComplete,
  rehabPlanId,
  queryClient,
  phaseContext, // { nms_shift_explanation, synergy_highlight, hardware_scientific_mechanism, software_scientific_mechanism, strength_scientific_mechanism }
}) {
  const [fullExercise, setFullExercise] = useState(exercise || {});
  const [isCompleted, setIsCompleted] = useState(exercise?.completed || false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [showCausal, setShowCausal] = useState(true);
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);

  const { isPlaying, isLoading: isTTSLoading, playText, stop, preload } = useTTS();

  // Fetch full exercise data from DB on open
  useEffect(() => {
    if (!isOpen || !exercise?.exercise_id) return;
    setFullExercise(exercise);
    setIsCompleted(exercise.completed || false);
    setIsFinishing(false);
    setPainLevel(0);

    base44.entities.Exercise.filter({ exercise_id: exercise.exercise_id })
      .then(results => {
        if (results?.length > 0) {
          const dbEx = results[0];
          setFullExercise(prev => ({
            ...prev,
            ...dbEx,
            sets_reps_tempo: exercise.sets_reps_tempo || dbEx.sets_reps_tempo,
            instruction: dbEx.description || dbEx.instruction || exercise.instruction,
          }));

          // Preload TTS
          const ttsText = buildTTSText({ ...exercise, ...dbEx });
          if (ttsText) preload(ttsText);
        }
      })
      .catch(() => {});
  }, [isOpen, exercise?.exercise_id]);

  const buildTTSText = (ex) => {
    const parts = [];
    if (ex.axon_moment) parts.push(`AXON Moment: ${ex.axon_moment}`);
    if (ex.instruction || ex.description) parts.push(ex.instruction || ex.description);
    if (ex.cues?.length) parts.push(`Ausführungs-Tipps: ${ex.cues.join('. ')}`);
    if (ex.breathing_instruction) parts.push(`Atmung: ${ex.breathing_instruction}`);

    // Add causal "WARUM" from phase context
    const cat = ex.category;
    const causal = CATEGORY_CAUSAL_MAP[cat];
    if (causal && phaseContext?.[causal.field]) {
      parts.push(`Das WARUM: ${phaseContext[causal.field]}`);
    }
    return parts.join('. ');
  };

  const handlePlayAudio = () => {
    if (isPlaying) { stop(); return; }
    const text = buildTTSText(fullExercise);
    if (text) playText(text);
  };

  const confirmFinish = () => {
    setIsCompleted(true);
    setIsFinishing(false);
    if (onComplete) onComplete({ ...exercise, completed: true, pain_level: painLevel });
    onClose();
  };

  if (!isOpen || !exercise || !fullExercise) return null;

  const cat = fullExercise?.category || 'mfr';
  const causal = CATEGORY_CAUSAL_MAP[cat] || CATEGORY_CAUSAL_MAP['mfr'];
  const causalText = phaseContext?.[causal.field];
  const CausalIcon = causal.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-slate-950 border-t border-emerald-500/30 shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${causal.color}`}>
                  {CATEGORY_LABEL[cat] || cat}
                </span>
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight mt-0.5">
                  {fullExercise.name}
                </h2>
                {fullExercise.sets_reps_tempo && (
                  <span className="text-xs text-slate-400 font-mono">{fullExercise.sets_reps_tempo}</span>
                )}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-6 space-y-6 pb-10">

              {/* ── AUDIO: Hauptfunktion ── */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                  Audio-Anleitung
                </p>
                <button
                  onClick={handlePlayAudio}
                  disabled={isTTSLoading}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isTTSLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Audio wird geladen…</>
                    : isPlaying
                    ? <><VolumeX className="w-5 h-5" /> Stoppen</>
                    : <><Volume2 className="w-5 h-5" /> Anleitung anhören</>
                  }
                </button>
                {isPlaying && (
                  <p className="text-[10px] text-emerald-400/70 text-center mt-2 animate-pulse">
                    ▶ Wird vorgelesen…
                  </p>
                )}
              </div>

              {/* ── AXON Moment ── */}
              {fullExercise.axon_moment && (
                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Brain className="w-3 h-3" /> AXON Moment
                  </p>
                  <p className="text-sm text-emerald-100 italic leading-relaxed">
                    "{fullExercise.axon_moment}"
                  </p>
                </div>
              )}

              {/* ── Ausführung ── */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Ausführung</p>
                <div className="text-sm text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-strong:text-emerald-300 prose-ul:pl-4">
                  <ReactMarkdown>{fullExercise.instruction || fullExercise.description || '—'}</ReactMarkdown>
                </div>
                {fullExercise.cues?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pro-Cues</p>
                    <ul className="space-y-1">
                      {fullExercise.cues.map((cue, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">›</span> {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {fullExercise.breathing_instruction && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Atmung</p>
                    <p className="text-xs text-slate-400 italic">{fullExercise.breathing_instruction}</p>
                  </div>
                )}
              </div>

              {/* ── Das WARUM (Kausalität) ── */}
              {causalText && (
                <div className={`rounded-xl border ${causal.border} ${causal.bg} p-4`}>
                  <button
                    onClick={() => setShowCausal(!showCausal)}
                    className="w-full flex items-center justify-between"
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${causal.color} flex items-center gap-1.5`}>
                      <CausalIcon className="w-3 h-3" /> {causal.label}
                    </p>
                    {showCausal ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <AnimatePresence>
                    {showCausal && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-xs text-slate-300 leading-relaxed mt-3 overflow-hidden"
                      >
                        {causalText}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Synergie der Phase ── */}
              {phaseContext?.synergy_highlight && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-400" /> Gesamt-Synergie dieser Phase
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed italic">{phaseContext.synergy_highlight}</p>
                </div>
              )}

              {/* ── Abschließen ── */}
              {!isFinishing ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setIsOuchModalOpen(true)}
                    className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" /> Ouch! — Schmerz melden
                  </button>
                  <button
                    onClick={() => isCompleted ? onClose() : setIsFinishing(true)}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
                    }`}
                  >
                    {isCompleted ? <><Check className="w-4 h-4 inline mr-2" />Abgeschlossen</> : '[ Übung abschließen ]'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white text-center">Schmerzlevel während der Übung?</h4>
                  <Slider
                    value={[painLevel]}
                    onValueChange={(v) => setPainLevel(v[0])}
                    max={10}
                    step={0.5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Kein Schmerz</span>
                    <span className="text-emerald-400">NRS {painLevel}</span>
                    <span>Max (10)</span>
                  </div>
                  <button
                    onClick={confirmFinish}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Fortschritt speichern
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <OuchInterventionModal
            isOpen={isOuchModalOpen}
            onClose={() => setIsOuchModalOpen(false)}
            exerciseId={fullExercise.exercise_id}
            exerciseName={fullExercise.name}
            rehabPlanId={rehabPlanId}
            onExerciseSubstituted={() => { if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] }); setIsOuchModalOpen(false); onClose(); }}
          />
        </>
      )}
    </AnimatePresence>
  );
}