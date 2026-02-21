import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Target, Lightbulb, CheckCircle2, RotateCcw, Flame, Timer, Brain, TrendingUp, TrendingDown, Zap, AlertTriangle, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TrainingExerciseCard({ exercise, idx, onDetailClick }) {
  const [fullExercise, setFullExercise] = useState(exercise);
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
            setFullExercise(prev => ({
              ...prev,
              ...dbEx,
              sets_reps_tempo: exercise.sets_reps_tempo || dbEx.sets_reps_tempo,
              instruction: exercise.instruction || dbEx.description || dbEx.instruction,
            }));
          }
        })
        .catch(() => {});
    }
  }, [exercise.exercise_id]);

  const parseSpecs = (raw) => {
    if (!raw) return [];
    const parts = raw.split(/[·|,]/).map(p => p.trim()).filter(Boolean);
    return parts.length > 1 ? parts : [raw];
  };
  const specParts = parseSpecs(fullExercise.sets_reps_tempo);

  const specConfig = [
    { icon: <Flame className="w-3.5 h-3.5" />, color: 'text-amber-400', border: 'border-amber-500/40' },
    { icon: <RotateCcw className="w-3.5 h-3.5" />, color: 'text-cyan-400', border: 'border-cyan-500/40' },
    { icon: <Timer className="w-3.5 h-3.5" />, color: 'text-teal-400', border: 'border-teal-500/40' },
  ];

  const allInstructionLines = (fullExercise.instruction || fullExercise.description || '')
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0);

  const hasBasic = !!fullExercise.progression_basic?.description;
  const hasAdvanced = !!fullExercise.progression_advanced?.description;
  const variantContent = activeVariant === 'basic' ? fullExercise.progression_basic
    : activeVariant === 'advanced' ? fullExercise.progression_advanced : null;

  const totalSaetze = (() => {
    const m = (fullExercise.sets_reps_tempo || '').match(/^(\d+)[x×]/);
    return m ? parseInt(m[1]) : 3;
  })();

  const handleSatzFertig = () => {
    if (satzCounter < totalSaetze) {
      setSatzCounter(prev => prev + 1);
      toast.success(`Satz ${satzCounter} ✓ — Kurze Pause!`);
    } else {
      setSatzDone(true);
      toast.success('🎉 Alle Sätze erledigt!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0a0f1a 0%, #0d1a2a 40%, #080f1a 100%)',
        border: '1px solid rgba(245,158,11,0.25)',
        boxShadow: '0 0 30px rgba(245,158,11,0.06), inset 0 0 60px rgba(0,0,0,0.4)'
      }}
    >
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(245,158,11,0.8) 24px, rgba(245,158,11,0.8) 25px),
                            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(245,158,11,0.8) 24px, rgba(245,158,11,0.8) 25px)`
        }}
      />

      {/* Neon top edge */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />

      <div className="relative px-5 pt-5 pb-4">
        {/* Title area */}
        <div className="text-center mb-5">
          <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'rgba(245,158,11,0.7)' }}>
            #{idx + 1}{fullExercise.category ? ` · ${fullExercise.category.toUpperCase()}` : ''}{fullExercise.stecco_chain ? ` · ${fullExercise.stecco_chain}` : ''}
          </p>
          <h3 className="text-2xl font-extrabold tracking-tight leading-tight text-white mb-1">
            {fullExercise.name}
          </h3>
          {fullExercise.difficulty && (
            <p className="text-xs capitalize" style={{ color: 'rgba(245,158,11,0.5)' }}>{fullExercise.difficulty}</p>
          )}
        </div>

        {/* Spec Pills */}
        {specParts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {specParts.map((part, i) => {
              const cfg = specConfig[i % specConfig.length];
              return (
                <div key={i} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border ${cfg.color} ${cfg.border}`}
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                  {cfg.icon}
                  {part}
                </div>
              );
            })}
          </div>
        )}

        {/* Variant Tabs */}
        {(hasBasic || hasAdvanced) && (
          <div className="flex justify-center gap-2 mb-4">
            {hasBasic && (
              <button onClick={() => setActiveVariant(activeVariant === 'basic' ? 'standard' : 'basic')}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                  activeVariant === 'basic' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'border-slate-600/60 text-slate-500 hover:text-green-400'
                }`}>
                <TrendingDown className="w-3 h-3" /> Basic
              </button>
            )}
            <button onClick={() => setActiveVariant('standard')}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                activeVariant === 'standard' ? 'border-amber-500/50 text-amber-300' : 'border-slate-600/60 text-slate-500'
              }`} style={activeVariant === 'standard' ? { background: 'rgba(245,158,11,0.1)' } : {}}>
              Standard
            </button>
            {hasAdvanced && (
              <button onClick={() => setActiveVariant(activeVariant === 'advanced' ? 'standard' : 'advanced')}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold transition-all ${
                  activeVariant === 'advanced' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'border-slate-600/60 text-slate-500 hover:text-purple-400'
                }`}>
                <TrendingUp className="w-3 h-3" /> Advanced
              </button>
            )}
          </div>
        )}

        {/* Variant Content */}
        <AnimatePresence>
          {variantContent && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`mb-4 rounded-xl p-3 border ${activeVariant === 'basic' ? 'bg-green-500/10 border-green-500/30' : 'bg-purple-500/10 border-purple-500/30'}`}>
              {variantContent.label && <p className={`text-xs font-bold mb-1 ${activeVariant === 'basic' ? 'text-green-400' : 'text-purple-400'}`}>{variantContent.label}</p>}
              <p className="text-sm text-slate-300 leading-snug">{variantContent.description}</p>
              {variantContent.focus && <p className={`text-xs mt-1.5 ${activeVariant === 'basic' ? 'text-green-400/70' : 'text-purple-400/70'}`}>Fokus: {variantContent.focus}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instruction Block */}
        {allInstructionLines.length > 0 && (
          <div className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(20,15,5,0.7)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <ul className="space-y-2.5">
              {allInstructionLines.map((line, i) => (
                <li key={i} className="text-sm text-slate-200 flex gap-2.5 leading-snug">
                  <span className="flex-shrink-0 font-bold" style={{ color: 'rgba(245,158,11,0.8)' }}>•</span>
                  <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AXON-Moment */}
        {fullExercise.axon_moment && (
          <div className="rounded-xl p-4 mb-4 flex gap-3 items-start"
            style={{
              background: 'rgba(30,20,0,0.8)',
              border: '1px solid rgba(245,158,11,0.35)',
              boxShadow: '0 0 16px rgba(245,158,11,0.08)'
            }}>
            <Brain className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <p className="text-sm leading-relaxed text-slate-200">
              <span className="font-bold text-amber-400">💡 AXON-Moment: </span>
              <span className="italic">"{fullExercise.axon_moment}"</span>
            </p>
          </div>
        )}

        {/* Details Toggle */}
        <button onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-xs py-1 transition-colors text-amber-500/50 hover:text-amber-400">
          {showDetails ? '▲ Weniger' : '▼ Cues · Benefits · Atmung'}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3">
              {fullExercise.cues?.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(120,80,220,0.1)', border: '1px solid rgba(140,100,240,0.25)' }}>
                  <p className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Ausführungs-Cues</p>
                  <ul className="space-y-1">{fullExercise.cues.map((cue, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-purple-400">•</span>{cue}</li>)}</ul>
                </div>
              )}
              {fullExercise.benefits && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,180,80,0.1)', border: '1px solid rgba(0,200,100,0.25)' }}>
                  <p className="text-xs font-bold text-green-400 mb-1">✨ Benefits</p>
                  <p className="text-sm text-slate-300">{fullExercise.benefits}</p>
                </div>
              )}
              {fullExercise.breathing_instruction && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,80,180,0.1)', border: '1px solid rgba(60,130,240,0.25)' }}>
                  <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1"><Wind className="w-3 h-3" /> Atmung</p>
                  <p className="text-sm text-slate-300">{fullExercise.breathing_instruction}</p>
                </div>
              )}
              {(fullExercise.goal_explanation || fullExercise.purpose_explanation) && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(220,120,0,0.1)', border: '1px solid rgba(240,150,0,0.25)' }}>
                  <p className="text-xs font-bold text-orange-400 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Warum diese Übung?</p>
                  <p className="text-sm text-slate-300">{fullExercise.goal_explanation || fullExercise.purpose_explanation}</p>
                </div>
              )}
              {fullExercise.notes && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(100,100,100,0.1)', border: '1px solid rgba(150,150,150,0.25)' }}>
                  <p className="text-xs font-bold text-slate-400 mb-1">📝 Hinweise</p>
                  <p className="text-sm text-slate-300">{fullExercise.notes}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: Satz Button */}
      <div className="relative px-4 pb-4">
        <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)' }} />
        {!satzDone ? (
          <button onClick={handleSatzFertig}
            className="w-full h-14 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-95 tracking-wide"
            style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
            <CheckCircle2 className="w-5 h-5" />
            SATZ {satzCounter} FERTIG {satzCounter < totalSaetze ? '(Weiter)' : '✓'}
          </button>
        ) : (
          <div className="w-full h-14 rounded-xl font-extrabold text-base flex items-center justify-center gap-2"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}>
            <CheckCircle2 className="w-5 h-5" />
            Alle {totalSaetze} Sätze erledigt! 🎉
          </div>
        )}
      </div>

      {/* Bottom neon edge */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }} />
    </motion.div>
  );
}