import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { base44 } from '@/api/base44Client';
import { Slider } from '@/components/ui/slider';
import OuchInterventionModal from './OuchInterventionModal';

const CATEGORY_LABEL = {
  mfr: 'MFR · Hardware-Reset',
  neuro: 'Neuro-Drill · Software-Update',
  breath: 'Atemarbeit',
  mobility: 'Mobilität',
  strength: 'Integration · Kraft',
};

const CATEGORY_COLOR = {
  mfr: 'text-orange-400',
  neuro: 'text-cyan-400',
  breath: 'text-blue-400',
  mobility: 'text-teal-400',
  strength: 'text-purple-400',
};

const CAUSAL_FIELD = {
  mfr: 'hardware_scientific_mechanism',
  neuro: 'software_scientific_mechanism',
  strength: 'strength_scientific_mechanism',
  breath: 'hardware_scientific_mechanism',
  mobility: 'hardware_scientific_mechanism',
};

export default function ExerciseDetailModal({
  exercise,
  isOpen,
  onClose,
  onComplete,
  rehabPlanId,
  queryClient,
  phaseContext,
  isSequential = false,
  totalExercises = 0,
  currentExerciseIdx = 0,
}) {
  const [fullExercise, setFullExercise] = useState(exercise || {});
  const [isCompleted, setIsCompleted] = useState(exercise?.completed || false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);

  const { isPlaying, isLoading: isTTSLoading, playText, stop } = useTTS();

  useEffect(() => {
    if (!isOpen || !exercise?.exercise_id) return;
    setFullExercise(exercise);
    setIsCompleted(exercise.completed || false);
    setIsFinishing(false);
    setPainLevel(0);
    setShowDetails(false);

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
        }
      })
      .catch(() => {});
  }, [isOpen, exercise?.exercise_id]);

  const buildTTSText = (ex) => {
    const parts = [];
    if (ex.name) parts.push(ex.name);
    if (ex.sets_reps_tempo) parts.push(ex.sets_reps_tempo);
    if (ex.axon_moment) parts.push(ex.axon_moment);
    if (ex.instruction || ex.description) parts.push(ex.instruction || ex.description);
    if (ex.cues?.length) parts.push(`Tipps: ${ex.cues.join('. ')}`);
    if (ex.breathing_instruction) parts.push(`Atmung: ${ex.breathing_instruction}`);
    const cat = ex.category;
    const causalField = CAUSAL_FIELD[cat];
    if (causalField && phaseContext?.[causalField]) {
      parts.push(`Das WARUM: ${phaseContext[causalField]}`);
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
    if (!isSequential) onClose();
  };

  if (!isOpen || !exercise || !fullExercise) return null;

  const cat = fullExercise?.category || 'mfr';
  const catColor = CATEGORY_COLOR[cat] || 'text-emerald-400';
  const causalField = CAUSAL_FIELD[cat];
  const causalText = phaseContext?.[causalField];

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
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-slate-950 border-t border-emerald-500/30 shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Sequential Progress Bar */}
            {isSequential && totalExercises > 0 && (
              <div className="px-5 pt-2 pb-0">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  <span>Übung {currentExerciseIdx + 1} von {totalExercises}</span>
                  <span className="text-emerald-400">{Math.round(((currentExerciseIdx) / totalExercises) * 100)}% done</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${(currentExerciseIdx / totalExercises) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${catColor}`}>
                  {CATEGORY_LABEL[cat] || cat}
                </span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mt-0.5">
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

            <div className="px-5 py-6 space-y-4 pb-10">

              {/* ── AUDIO: Herzstück — groß und prominent ── */}
              <button
                onClick={handlePlayAudio}
                disabled={isTTSLoading}
                className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-base transition-all active:scale-[0.98] ${
                  isPlaying
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-xl shadow-emerald-500/30'
                }`}
              >
                {isTTSLoading
                  ? <><Loader2 className="w-6 h-6 animate-spin" /> Wird geladen…</>
                  : isPlaying
                  ? <><VolumeX className="w-6 h-6" /> Stoppen</>
                  : <><Volume2 className="w-6 h-6" /> Anleitung anhören</>
                }
              </button>

              {/* Playing wave indicator */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 h-6 bg-emerald-400 rounded-full"
                    />
                  ))}
                  <span className="text-xs text-emerald-400 ml-2 font-medium">Coach spricht…</span>
                </div>
              )}

              {/* ── AXON Moment — als Quote ── */}
              {fullExercise.axon_moment && (
                <div className="rounded-2xl bg-slate-900 border border-slate-800 px-5 py-4">
                  <p className="text-emerald-100 text-sm italic leading-relaxed text-center">
                    „{fullExercise.axon_moment}"
                  </p>
                </div>
              )}

              {/* ── Details aufklappen ── */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <span>Anleitung & Details</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-3"
                  >
                    {/* Ausführung */}
                    {(fullExercise.instruction || fullExercise.description) && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Ausführung</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {fullExercise.instruction || fullExercise.description}
                        </p>
                      </div>
                    )}

                    {/* Pro-Cues */}
                    {fullExercise.cues?.length > 0 && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
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

                    {/* Atmung */}
                    {fullExercise.breathing_instruction && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Atmung</p>
                        <p className="text-xs text-slate-400 italic">{fullExercise.breathing_instruction}</p>
                      </div>
                    )}

                    {/* Das WARUM */}
                    {causalText && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Das WARUM</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{causalText}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Actions ── */}
              {!isFinishing ? (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setIsOuchModalOpen(true)}
                    className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" /> Ouch! — Schmerz melden
                  </button>
                  <button
                    onClick={() => setIsFinishing(true)}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20"
                  >
                    {isSequential
                      ? currentExerciseIdx + 1 < totalExercises
                        ? '✓ Fertig · Weiter →'
                        : '✓ Session abschließen 🎉'
                      : '✓ Übung abschließen'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
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
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    {isSequential && currentExerciseIdx + 1 < totalExercises ? 'Speichern & Weiter →' : 'Fortschritt speichern'}
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
            onExerciseSubstituted={() => {
              if (queryClient) queryClient.invalidateQueries({ queryKey: ['rehabPlan'] });
              setIsOuchModalOpen(false);
              onClose();
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}