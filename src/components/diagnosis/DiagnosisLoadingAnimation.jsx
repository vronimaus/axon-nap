import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Zap, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

const steps = [
  { icon: Brain,       label: "Schmerzregion analysieren",      duration: 4000 },
  { icon: Activity,    label: "Faszien-Ketten identifizieren",  duration: 5000 },
  { icon: Zap,         label: "Übungsprotokoll selektieren",    duration: 6000 },
  { icon: Sparkles,    label: "3-Phasen-Plan generieren",       duration: 10000 },
  { icon: Shield,      label: "Plan validieren & speichern",    duration: 5000 },
];

const facts = [
  "Faszien speichern 10× mehr sensorische Informationen als Muskeln.",
  "Dein Nervensystem entscheidet, wie viel Bewegungsfreiheit es dir gibt.",
  "Schmerz entsteht im Gehirn – nicht im Gewebe.",
  "Myofasziale Ketten verbinden deinen ganzen Körper wie ein 3D-Netz.",
  "Neuro-Drills können Bewegungsfreiheit in Sekunden freischalten.",
  "80 % aller Rückenschmerzen haben keine strukturelle Ursache.",
];

export default function DiagnosisLoadingAnimation({ message = "Analysiere dein Problem..." }) {
  const [currentStep, setCurrentStep]   = useState(0);
  const [completedSteps, setCompleted]  = useState([]);
  const [factIndex, setFactIndex]       = useState(0);
  const [elapsed, setElapsed]           = useState(0);

  // Advance steps by their individual durations
  useEffect(() => {
    let step = 0;
    const advance = () => {
      if (step >= steps.length - 1) return;
      const timer = setTimeout(() => {
        setCompleted(prev => [...prev, step]);
        step += 1;
        setCurrentStep(step);
        advance();
      }, steps[step].duration);
      return timer;
    };
    const t = advance();
    return () => clearTimeout(t);
  }, []);

  // Rotate facts every 5 s
  useEffect(() => {
    const t = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Running clock
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const totalEstimate = steps.reduce((s, st) => s + st.duration, 0) / 1000;
  const progress = Math.min((elapsed / totalEstimate) * 100, 95);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center py-12 px-4">

      {/* Pulsing icon ring */}
      <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-cyan-500/20"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-1 rounded-full border-t-2 border-cyan-400/60 border-l-transparent border-b-transparent border-r-transparent"
        />
        {React.createElement(steps[currentStep]?.icon || Brain, {
          className: "w-10 h-10 text-cyan-400 relative z-10"
        })}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-1 text-center">{message}</h3>
      <p className="text-xs text-slate-500 font-mono mb-8">{elapsed}s</p>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="w-full max-w-sm space-y-2 mb-8">
        {steps.map((step, idx) => {
          const done    = completedSteps.includes(idx);
          const active  = currentStep === idx;
          const pending = idx > currentStep;
          return (
            <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
              active  ? 'bg-cyan-500/10 border border-cyan-500/30' :
              done    ? 'bg-slate-800/40 border border-emerald-500/20' :
                        'opacity-30'
            }`}>
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : active ? (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 ml-1 mr-0.5"
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0 ml-1 mr-0.5" />
              )}
              <span className={`text-sm font-medium ${
                done ? 'text-emerald-400' : active ? 'text-cyan-300' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
              {active && (
                <motion.div className="ml-auto flex gap-0.5">
                  {[0,1,2].map(i => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-cyan-400 block"
                    />
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Did you know */}
      <div className="w-full max-w-sm px-5 py-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
        <p className="text-[10px] font-bold text-cyan-400 mb-1.5 uppercase tracking-widest font-mono">Wusstest du?</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={factIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-slate-300 leading-relaxed"
          >
            {facts[factIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}