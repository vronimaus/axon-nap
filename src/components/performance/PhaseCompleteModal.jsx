import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Target, Trophy, RotateCcw, ArrowRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PhaseCompleteModal
 * Shown after user clicks "Phase abschließen".
 * Prompts a self-test of the goal skill, then routes to:
 *  - next phase (if not last)
 *  - success screen (if last phase AND goal met or user chooses to continue)
 *
 * Props:
 *  - phase: current phase object
 *  - phaseIndex: 0-based index
 *  - totalPhases: total number of phases
 *  - goalDescription: the overall plan goal (e.g. "100 Burpees schaffen")
 *  - isLastPhase: boolean
 *  - onContinue: () => void  — go to next phase or finish
 *  - onRepeatPhase: () => void — stay on this phase
 *  - onClose: () => void
 */
export default function PhaseCompleteModal({
  phase,
  phaseIndex,
  totalPhases,
  goalDescription,
  isLastPhase,
  onContinue,
  onRepeatPhase,
  onClose,
}) {
  const [step, setStep] = useState('test'); // 'test' | 'result' | 'success'
  const [testValue, setTestValue] = useState(null); // number or 'done'
  const [inputMode, setInputMode] = useState('counter'); // 'counter' | 'binary'

  // Detect if goal is countable (reps-based) or binary (yes/no)
  const isCountable = /\d/.test(goalDescription) || 
    /wiederholungen|reps|mal|sekunden|minuten|km|kg/i.test(goalDescription);

  const handleTestSubmit = (value) => {
    setTestValue(value);
    if (isLastPhase) {
      setStep('success');
    } else {
      setStep('result');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'test' && (
            <TestStep
              key="test"
              phaseIndex={phaseIndex}
              totalPhases={totalPhases}
              goalDescription={goalDescription}
              isCountable={isCountable}
              isLastPhase={isLastPhase}
              onSubmit={handleTestSubmit}
            />
          )}
          {step === 'result' && (
            <ResultStep
              key="result"
              phaseIndex={phaseIndex}
              totalPhases={totalPhases}
              testValue={testValue}
              goalDescription={goalDescription}
              onContinue={onContinue}
              onRepeat={onRepeatPhase}
            />
          )}
          {step === 'success' && (
            <SuccessStep
              key="success"
              testValue={testValue}
              goalDescription={goalDescription}
              onFinish={onContinue}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Step 1: Self-Test ───────────────────────────────────────────────────────

function TestStep({ phaseIndex, totalPhases, goalDescription, isCountable, isLastPhase, onSubmit }) {
  const [count, setCount] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
            Phase {phaseIndex + 1} / {totalPhases} abgeschlossen
          </p>
          <h3 className="text-lg font-bold text-white">Jetzt testen!</h3>
        </div>
      </div>

      {/* Goal reminder */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Dein Ziel</p>
        <p className="text-sm font-semibold text-white">{goalDescription}</p>
      </div>

      {/* Instruction */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-200">
          Mach jetzt einen kurzen Selbsttest:{' '}
          <span className="text-cyan-400">
            {isCountable
              ? 'Wie viele Wiederholungen / Wie lange schaffst du heute?'
              : 'Klappt die Übung schon gut?'}
          </span>
        </p>
        <p className="text-xs text-slate-500">
          Kein Druck — das ist nur ein Orientierungswert für dich selbst.
        </p>
      </div>

      {/* Input */}
      {isCountable ? (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCount(Math.max(0, count - 1))}
            className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="w-24 h-16 rounded-xl bg-slate-800/80 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-3xl font-bold text-cyan-400">{count}</span>
          </div>
          <button
            onClick={() => setCount(count + 1)}
            className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onSubmit('yes')}
            className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-all"
          >
            ✓ Ja, klappt gut
          </button>
          <button
            onClick={() => onSubmit('no')}
            className="py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-sm hover:border-slate-500 transition-all"
          >
            Noch nicht ganz
          </button>
        </div>
      )}

      {/* Submit button for counter mode */}
      {isCountable && (
        <Button
          onClick={() => onSubmit(count)}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold"
        >
          Weiter →
        </Button>
      )}
    </motion.div>
  );
}

// ─── Step 2: Result + Next Phase ────────────────────────────────────────────

function ResultStep({ phaseIndex, totalPhases, testValue, goalDescription, onContinue, onRepeat }) {
  const isGood = testValue === 'yes' || (typeof testValue === 'number' && testValue > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-5"
    >
      {/* Result */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${
        isGood ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <span className="text-2xl">{isGood ? '💪' : '🔄'}</span>
        <div>
          <p className={`text-sm font-bold mb-1 ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isGood
              ? typeof testValue === 'number'
                ? `${testValue} Reps — starke Leistung!`
                : 'Super — du machst Fortschritte!'
              : 'Noch nicht perfekt — das ist völlig normal.'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isGood
              ? `Dein System hat sich angepasst. Phase ${phaseIndex + 2} wartet auf dich.`
              : 'Kein Zeitdruck. Du kannst Phase ' + (phaseIndex + 1) + ' wiederholen oder direkt weiterziehen — du entscheidest.'}
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalPhases }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= phaseIndex ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center">
        Phase {phaseIndex + 2} von {totalPhases} als nächstes
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={onContinue}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Weiter zu Phase {phaseIndex + 2}
        </Button>
        <button
          onClick={onRepeat}
          className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Phase {phaseIndex + 1} wiederholen
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Final Success ───────────────────────────────────────────────────

function SuccessStep({ testValue, goalDescription, onFinish }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center space-y-6"
    >
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2, damping: 12 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(251,191,36,0.4)]"
      >
        <Trophy className="w-10 h-10 text-white" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Ziel erreicht!</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Du hast alle Phasen deines Plans abgeschlossen.
        </p>
        {typeof testValue === 'number' && testValue > 0 && (
          <div className="inline-block bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-2 mt-2">
            <span className="text-2xl font-black text-cyan-400">{testValue}</span>
            <span className="text-xs text-slate-400 ml-2">beim heutigen Test</span>
          </div>
        )}
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 text-left">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Dein Ziel war</p>
        <p className="text-sm font-semibold text-white">{goalDescription}</p>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Dein System hat sich Schritt für Schritt angepasst. Wenn du weitermachen willst — starte einen neuen Plan mit einem höheren Ziel.
      </p>

      <Button
        onClick={onFinish}
        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-black text-base py-6"
      >
        <Trophy className="w-5 h-5 mr-2" />
        Abgeschlossen!
      </Button>
    </motion.div>
  );
}