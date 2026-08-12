import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'acute_injury',
    text: 'Hast du akute Verletzungen, die aktuell ärztlich behandelt werden?',
  },
  {
    id: 'numbness',
    text: 'Spürst du Taubheit oder Kribbeln in Armen oder Beinen?',
  },
  {
    id: 'inflammation',
    text: 'Ist der betroffene Bereich heiß, rot oder geschwollen?',
  },
];

export default function SafetyCheck({ onConfirm }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showRedFlag, setShowRedFlag] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleAnswer = (answer) => {
    const updated = { ...answers, [QUESTIONS[currentQ].id]: answer };
    setAnswers(updated);

    if (answer === 'yes') {
      setShowRedFlag(true);
      return;
    }

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowDisclaimer(true);
    }
  };

  // Red Flag → user needs medical attention
  if (showRedFlag) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full border border-red-500/40 bg-red-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 mb-1">Stopp</p>
          <h3 className="text-base font-bold text-white">Bitte ärztlich abklären</h3>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-slate-300 leading-relaxed text-center">
            Bei diesen Anzeichen ist eine medizinische Fachperson der richtige Ansprechpartner.
            AXON ist ein Mobility-Tool und ersetzt keine medizinische Diagnose.
          </p>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Sobald deine Beschwerden ärztlich abgeklärt sind, kannst du AXON zur Mobilitäts-Optimierung nutzen.
        </p>
      </motion.div>
    );
  }

  // All clear → show disclaimer, then confirm
  if (showDisclaimer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">Alles klar</p>
          <h3 className="text-base font-bold text-white">Los geht's</h3>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-200/80 leading-relaxed text-center">
            <strong className="text-amber-400">Wichtig:</strong> AXON ist ein Mobility- und Performance-Tool.
            Es ersetzt keine medizinische Diagnose oder Behandlung. Bei akuten Schmerzen, Verletzungen oder
            anhaltenden Beschwerden wende dich an eine medizinische Fachperson. Du nutzt die Übungen auf eigene Verantwortung.
          </p>
        </div>

        <button
          onClick={onConfirm}
          className="w-full h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-sm border border-emerald-500/40 transition-all active:scale-95"
        >
          ✓ Verstanden, weiter
        </button>
      </motion.div>
    );
  }

  // Active question
  const question = QUESTIONS[currentQ];
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-full border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center mb-3">
          <ShieldCheck className="w-7 h-7 text-cyan-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-1">Sicherheits-Check</p>
        <h3 className="text-base font-bold text-white">Kurz gecheckt — dann starten</h3>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-2">
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className={`h-1 rounded-full transition-all ${i <= currentQ ? 'w-6 bg-cyan-500' : 'w-3 bg-slate-700'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 mb-4">
            <p className="text-sm text-slate-200 leading-relaxed text-center">
              {question.text}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer('no')}
              className="h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm border border-emerald-500/30 transition-all active:scale-95"
            >
              Nein
            </button>
            <button
              onClick={() => handleAnswer('yes')}
              className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-600 transition-all active:scale-95"
            >
              Ja
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}