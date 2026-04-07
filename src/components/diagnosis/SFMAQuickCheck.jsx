import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Thermometer, AlertTriangle } from 'lucide-react';

// Red flag symptoms that override NRS and trigger red flag regardless
const RED_FLAG_SYMPTOMS = [
  { id: 'numbness', label: 'Taubheit oder Kribbeln', icon: '⚡' },
  { id: 'radiation', label: 'Ausstrahlung in Arm oder Bein', icon: '↗' },
  { id: 'trauma', label: 'Sturz / Unfall / Trauma', icon: '💥' },
  { id: 'bladder', label: 'Blasen- oder Darmprobleme (bei Rückenschmerz)', icon: '🔴' },
  { id: 'fever', label: 'Fieber gleichzeitig', icon: '🌡' },
  { id: 'night', label: 'Schmerz nachts schlimmer als tagsüber', icon: '🌙' },
];

export default function SFMAQuickCheck({ region, onDecision }) {
  const [step, setStep] = useState('type'); // 'type' | 'nrs' | 'redflags'
  const [painType, setPainType] = useState(null); // 'pain' | 'stiffness'
  const [nrs, setNrs] = useState(5);
  const [flagAnswers, setFlagAnswers] = useState({});

  const hasAnyRedFlag = Object.values(flagAnswers).some(v => v === true);

  const handleTypeSelect = (type) => {
    setPainType(type);
    if (type === 'stiffness') {
      // Steifigkeit → direkt Tune-Up, kein weiterer Check nötig
      onDecision({ type: 'tune_up', painType: 'stiffness', nrs: 0, region });
    } else {
      setStep('nrs');
    }
  };

  const handleNrsConfirm = () => {
    if (nrs >= 7) {
      setStep('redflags');
    } else {
      // < 7 → Tune-Up
      onDecision({ type: 'tune_up', painType: 'pain', nrs, region });
    }
  };

  const handleFlagAnswer = (id, value) => {
    setFlagAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleRedFlagConfirm = () => {
    onDecision({
      type: 'red_flag',
      painType: 'pain',
      nrs,
      region,
      flags: Object.entries(flagAnswers)
        .filter(([, v]) => v === true)
        .map(([k]) => k),
      allFlags: flagAnswers
    });
  };

  const allFlagsAnswered = Object.keys(flagAnswers).length === RED_FLAG_SYMPTOMS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">

        {/* STEP 1: Schmerztyp */}
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schnell-Check · {region}</p>
              <h2 className="text-2xl font-bold text-white mb-2">Was spürst du?</h2>
              <p className="text-slate-400 text-sm">Sei ehrlich — das bestimmt deinen optimalen Weg</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelect('pain')}
                className="group glass rounded-2xl border border-red-500/30 p-6 hover:border-red-500/60 active:scale-95 transition-all text-center"
              >
                <div className="text-4xl mb-3">🔴</div>
                <p className="text-white font-bold text-lg mb-1">Schmerz</p>
                <p className="text-slate-400 text-xs leading-relaxed">Stechend, brennend oder dumpf — eindeutig Schmerz</p>
              </button>

              <button
                onClick={() => handleTypeSelect('stiffness')}
                className="group glass rounded-2xl border border-blue-500/30 p-6 hover:border-blue-500/60 active:scale-95 transition-all text-center"
              >
                <div className="text-4xl mb-3">🔵</div>
                <p className="text-white font-bold text-lg mb-1">Steifigkeit</p>
                <p className="text-slate-400 text-xs leading-relaxed">Schwer, eingerostet, eingeschränkte Bewegung</p>
              </button>
            </div>

            <p className="text-center text-xs text-slate-500">
              Bei Steifigkeit starten wir sofort mit dem Reset
            </p>
          </motion.div>
        )}

        {/* STEP 2: NRS Slider */}
        {step === 'nrs' && (
          <motion.div
            key="nrs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schmerzintensität</p>
              <h2 className="text-2xl font-bold text-white mb-2">Wie stark ist der Schmerz?</h2>
              <p className="text-slate-400 text-sm">Jetzt gerade, in diesem Moment</p>
            </div>

            {/* NRS Visual */}
            <div className="glass rounded-2xl border border-slate-700 p-6 text-center">
              <div className="text-8xl font-black mb-2" style={{
                color: nrs <= 3 ? '#22c55e' : nrs <= 6 ? '#f59e0b' : '#ef4444'
              }}>
                {nrs}
              </div>
              <p className="text-slate-400 text-sm mb-6">
                {nrs <= 3 ? 'Mild — gut managebar' :
                  nrs <= 6 ? 'Moderat — unangenehm' :
                  'Stark — beeinträchtigt dich'}
              </p>

              {/* Slider */}
              <input
                type="range"
                min={1}
                max={10}
                value={nrs}
                onChange={e => setNrs(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #f59e0b 50%, #ef4444 100%)`,
                  accentColor: nrs <= 3 ? '#22c55e' : nrs <= 6 ? '#f59e0b' : '#ef4444'
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 — kaum</span>
                <span>10 — unerträglich</span>
              </div>
            </div>

            <Button
              onClick={handleNrsConfirm}
              className={`w-full h-14 font-bold text-base ${
                nrs >= 7
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
              }`}
            >
              {nrs >= 7 ? '⚠️ Weiter zur Sicherheitsprüfung' : '✓ Tune-Up starten →'}
            </Button>

            <button onClick={() => setStep('type')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

        {/* STEP 3: Red Flag Symptom-Check (nur bei NRS ≥ 7) */}
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
                <p className="text-amber-400 font-bold text-sm mb-1">Schmerz NRS {nrs}/10 erkannt</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Bei höheren Schmerzwerten prüfen wir kurz ob weitere Symptome vorliegen, 
                  bevor wir den besten Weg für dich bestimmen.
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

            <button onClick={() => setStep('nrs')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}