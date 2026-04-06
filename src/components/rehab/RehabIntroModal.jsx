import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ChevronRight } from 'lucide-react';

const COACH_AVATARS = {
  male: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/3031e6f06_TechnicalSystemsArchitectAXON-nap.jpg',
  female: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/a7949b2c4_EmpatheticGuideAXON-nap.jpg',
  neuro: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/2df3d8dc0_NeuralGuideAXON-nap.jpg'
};

const COACH_NAMES = {
  male: 'Coach Alex',
  female: 'Coach Sara',
  neuro: 'Neuro-Coach'
};

export default function RehabIntroModal({ isOpen, onStart, rehabPlan, userName, preferredCoach = 'male' }) {
  const [step, setStep] = useState(0); // 0 = intro, 1 = plan overview

  if (!isOpen || !rehabPlan) return null;

  const avatarSrc = COACH_AVATARS[preferredCoach] || COACH_AVATARS.male;
  const coachName = COACH_NAMES[preferredCoach] || COACH_NAMES.male;
  const firstName = userName?.split(' ')[0] || 'du';
  const problem = rehabPlan.problem_summary || 'dein Anliegen';

  // Collect all exercises from current phase
  const currentPhaseIdx = Math.max(0, (rehabPlan.current_phase || 1) - 1);
  const currentPhase = rehabPlan.phases?.[currentPhaseIdx];
  const exercises = currentPhase?.exercises || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-slate-950 rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden">

              {/* Step 0: Coach Intro */}
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 flex flex-col items-center text-center"
                  >
                    {/* Large Avatar */}
                    <div className="relative mb-5">
                      <div className="w-36 h-36 rounded-full p-[3px] bg-gradient-to-b from-emerald-400 to-teal-600 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                          <img
                            src={avatarSrc}
                            alt={coachName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      {/* Live indicator */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-900 border border-emerald-500/50 rounded-full px-2 py-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                      </div>
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">{coachName}</p>

                    {/* Speech Bubble */}
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl rounded-tl-sm p-5 text-left mt-2 mb-6">
                      <p className="text-white text-sm leading-relaxed font-medium">
                        Hey <span className="text-emerald-400 font-bold">{firstName}</span>! 👋
                        <br /><br />
                        Ich bin heute dein Coach. Wir arbeiten gemeinsam an:
                        <br />
                        <span className="text-emerald-300 font-semibold">„{problem}"</span>
                      </p>
                      {currentPhase && (
                        <p className="text-slate-400 text-xs mt-3 leading-relaxed">
                          Heute starten wir mit <span className="text-white font-semibold">Phase {rehabPlan.current_phase || 1}</span>: {currentPhase.title}.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-slate-900 font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                    >
                      Was machen wir heute? <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="plan"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6"
                  >
                    {/* Small avatar + speech */}
                    <div className="flex items-start gap-3 mb-5">
                      <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-b from-emerald-400 to-teal-600 flex-shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                          <img src={avatarSrc} alt={coachName} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex-1">
                        <p className="text-white text-sm leading-relaxed">
                          Dein Programm für heute — ich begleite dich durch jede Übung per Audio. 🎧
                        </p>
                      </div>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-2 mb-6">
                      {exercises.slice(0, 6).map((ex, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-black text-emerald-400">{String(i + 1).padStart(2, '0')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                            {ex.sets_reps_tempo && (
                              <p className="text-[10px] text-slate-500 font-mono">{ex.sets_reps_tempo}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {exercises.length > 6 && (
                        <p className="text-center text-xs text-slate-500">+{exercises.length - 6} weitere Übungen</p>
                      )}
                    </div>

                    <button
                      onClick={onStart}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-slate-900 font-black text-sm uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                    >
                      <Play className="w-5 h-5" /> Training starten
                    </button>

                    <button
                      onClick={() => setStep(0)}
                      className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      ← Zurück
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}