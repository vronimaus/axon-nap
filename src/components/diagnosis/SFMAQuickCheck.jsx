import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const RED_FLAG_SYMPTOMS = [
  { id: 'numbness', label: 'Taubheit oder Kribbeln', icon: '⚡' },
  { id: 'radiation', label: 'Ausstrahlung in Arm oder Bein', icon: '↗' },
  { id: 'trauma', label: 'Sturz / Unfall / Trauma', icon: '💥' },
  { id: 'bladder', label: 'Blasen- oder Darmprobleme (bei Rückenschmerz)', icon: '🔴' },
  { id: 'fever', label: 'Fieber gleichzeitig', icon: '🌡' },
  { id: 'night', label: 'Schmerz nachts schlimmer als tagsüber', icon: '🌙' },
];

// Unified scale: 1-3 = Steifigkeit, 4-6 = leichter Schmerz, 7-10 = starker Schmerz
function getScaleInfo(value) {
  if (value <= 3) return {
    label: 'Steifigkeit / Unbehagen',
    sub: 'Eingeschränkt, schwer, eingerostet — kein echter Schmerz',
    color: '#06b6d4',
    type: 'stiffness',
    emoji: '🔵'
  };
  if (value <= 6) return {
    label: 'Leichter bis moderater Schmerz',
    sub: 'Spürbar unangenehm, aber managebar',
    color: '#f59e0b',
    type: 'pain_mild',
    emoji: '🟡'
  };
  return {
    label: 'Starker Schmerz',
    sub: 'Deutlich beeinträchtigend — wir prüfen kurz die Sicherheit',
    color: '#ef4444',
    type: 'pain_strong',
    emoji: '🔴'
  };
}

export default function SFMAQuickCheck({ region, onDecision }) {
  const [step, setStep] = useState('scale'); // 'scale' | 'redflags'
  const [value, setValue] = useState(3);
  const [flagAnswers, setFlagAnswers] = useState({});

  const info = getScaleInfo(value);
  const hasAnyRedFlag = Object.values(flagAnswers).some(v => v === true);
  const allFlagsAnswered = Object.keys(flagAnswers).length === RED_FLAG_SYMPTOMS.length;

  const handleConfirm = () => {
    if (value >= 7) {
      setStep('redflags');
    } else {
      onDecision({
        type: 'tune_up',
        symptomType: info.type === 'stiffness' ? 'steifigkeit' : 'schmerz',
        nrs: value,
        region
      });
    }
  };

  const handleFlagAnswer = (id, val) => {
    setFlagAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleRedFlagConfirm = () => {
    onDecision({
      type: hasAnyRedFlag ? 'red_flag' : 'tune_up',
      symptomType: 'schmerz',
      nrs: value,
      region,
      flags: Object.entries(flagAnswers).filter(([, v]) => v === true).map(([k]) => k),
      allFlags: flagAnswers
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">

        {/* EINZIGER SCREEN: Unified Skala */}
        {step === 'scale' && (
          <motion.div
            key="scale"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schnell-Check · {region}</p>
              <h2 className="text-2xl font-bold text-white mb-2">Wie fühlt sich das an?</h2>
              <p className="text-slate-400 text-sm">Von Steifigkeit bis Schmerz — wähle deinen aktuellen Zustand</p>
            </div>

            {/* Big Value Display */}
            <div className="glass rounded-2xl border border-slate-700 p-6 text-center">
              <div className="text-7xl font-black mb-1 transition-all duration-200" style={{ color: info.color }}>
                {info.emoji}
              </div>
              <p className="text-xl font-bold text-white mb-1">{info.label}</p>
              <p className="text-slate-400 text-sm mb-6">{info.sub}</p>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #f59e0b 50%, #ef4444 100%)`,
                  accentColor: info.color
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 — nur steif</span>
                <span className="text-slate-600">Stufe {value}</span>
                <span>10 — unerträglich</span>
              </div>

              {/* Scale legend */}
              <div className="flex gap-2 mt-5 text-[10px]">
                <div className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">1–3 Steifigkeit</div>
                <div className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">4–6 Schmerz mild</div>
                <div className="flex-1 py-1.5 px-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold">7–10 Schmerz stark</div>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              className={`w-full h-14 font-bold text-base transition-all ${
                value >= 7
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
              }`}
            >
              {value >= 7 ? '⚠️ Weiter zur Sicherheitsprüfung' : '✓ Tune-Up starten →'}
            </Button>
          </motion.div>
        )}

        {/* Red Flag Check (nur bei Wert ≥ 7) */}
        {step === 'redflags' && (
          <motion.div
            key="redflags"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl border border-amber-500/30 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-bold text-sm mb-1">Intensität {value}/10 erkannt</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Bei stärkerem Schmerz prüfen wir kurz, ob weitere Symptome vorliegen —
                  damit wir den sichersten Weg für dich wählen.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {RED_FLAG_SYMPTOMS.map((flag) => (
                <div key={flag.id} className="glass rounded-xl border border-slate-700 p-4">
                  <p className="text-slate-200 text-sm mb-3 flex items-start gap-2">
                    <span className="flex-shrink-0">{flag.icon}</span>
                    {flag.label}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFlagAnswer(flag.id, true)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        flagAnswers[flag.id] === true
                          ? 'bg-red-500/30 border border-red-500/60 text-red-400'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      Ja
                    </button>
                    <button
                      onClick={() => handleFlagAnswer(flag.id, false)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        flagAnswers[flag.id] === false
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      Nein
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {allFlagsAnswered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleRedFlagConfirm}
                  className={`w-full h-14 font-bold text-base ${
                    hasAnyRedFlag
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  }`}
                >
                  {hasAnyRedFlag ? '→ Sicherheitsprotokoll anzeigen' : '→ Tune-Up starten'}
                </Button>
              </motion.div>
            )}

            <button onClick={() => setStep('scale')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}