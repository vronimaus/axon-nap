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

// FMS-angelehnte 4-stufige Bewegungsqualität
const MOVEMENT_LEVELS = [
  {
    value: 1,
    emoji: '🟢',
    label: 'Frei',
    sub: 'Ich bewege mich flüssig und ohne Widerstand',
  },
  {
    value: 2,
    emoji: '🟡',
    label: 'Zäh',
    sub: 'Ich komme ans Ziel, muss aber ausweichen oder kompensieren',
  },
  {
    value: 3,
    emoji: '🟠',
    label: 'Eingeschränkt',
    sub: 'Ich kann die Bewegung nicht vollständig ausführen',
  },
  {
    value: 4,
    emoji: '🔴',
    label: 'Blockiert',
    sub: 'Ich komme gar nicht in die Position',
  },
];

// NRS 0–8 Schmerz-Labels (alltagsnah)
function getPainLabel(v) {
  if (v === 0) return { emoji: '⚪', text: 'Kein Schmerz' };
  if (v === 1) return { emoji: '🟢', text: 'Kaum wahrnehmbar' };
  if (v === 2) return { emoji: '🟢', text: 'Leicht' };
  if (v === 3) return { emoji: '🟡', text: 'Deutlich merkbar' };
  if (v === 4) return { emoji: '🟡', text: 'Unangenehm' };
  if (v === 5) return { emoji: '🟠', text: 'Stark' };
  if (v === 6) return { emoji: '🟠', text: 'Sehr stark' };
  if (v === 7) return { emoji: '🔴', text: 'Heftig' };
  return { emoji: '🔴', text: 'Unerträglich' };
}

export default function SFMAQuickCheck({ region, onDecision }) {
  const [step, setStep] = useState('movement'); // 'movement' | 'pain_rest' | 'pain_move' | 'redflags'
  const [movementLevel, setMovementLevel] = useState(null);
  const [painRest, setPainRest] = useState(0);
  const [painMove, setPainMove] = useState(0);
  const [flagAnswers, setFlagAnswers] = useState({});

  const hasAnyRedFlag = Object.values(flagAnswers).some(v => v === true);
  const allFlagsAnswered = Object.keys(flagAnswers).length === RED_FLAG_SYMPTOMS.length;
  const maxPain = Math.max(painRest, painMove);

  const handleMovementSelect = (val) => {
    setMovementLevel(val);
  };

  const handleMovementConfirm = () => {
    setStep('pain_rest');
  };

  const handlePainRestConfirm = () => {
    setStep('pain_move');
  };

  const handlePainMoveConfirm = () => {
    const max = Math.max(painRest, painMove);
    if (max >= 7) {
      setStep('redflags');
    } else {
      onDecision({
        type: 'tune_up',
        symptomType: maxPain === 0 ? 'steifigkeit' : 'schmerz',
        movement_level: movementLevel,
        pain_rest: painRest,
        pain_move: painMove,
        nrs: max,
        region,
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
      movement_level: movementLevel,
      pain_rest: painRest,
      pain_move: painMove,
      nrs: Math.max(painRest, painMove),
      region,
      flags: Object.entries(flagAnswers).filter(([, v]) => v === true).map(([k]) => k),
      allFlags: flagAnswers,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">

        {/* SCREEN 1: Bewegungseinschränkung (FMS-angelehnt, 4-stufig) */}
        {step === 'movement' && (
          <motion.div
            key="movement"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schnell-Check · {region}</p>
              <h2 className="text-2xl font-bold text-white mb-1">Wie ist deine Beweglichkeit?</h2>
              <p className="text-slate-400 text-sm">Unabhängig vom Schmerz — nur die Bewegung selbst</p>
            </div>

            <div className="space-y-2">
              {MOVEMENT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleMovementSelect(level.value)}
                  className={`w-full rounded-xl border p-4 text-left flex items-center gap-4 transition-all active:scale-[0.98] ${
                    movementLevel === level.value
                      ? 'border-cyan-500/60 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl flex-shrink-0">{level.emoji}</span>
                  <div>
                    <p className={`font-bold text-base ${movementLevel === level.value ? 'text-cyan-300' : 'text-white'}`}>
                      {level.value}  —  {level.label}
                    </p>
                    <p className="text-slate-400 text-sm mt-0.5">{level.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {movementLevel !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleMovementConfirm}
                  className="w-full h-14 font-bold text-base bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                >
                  Weiter →
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* SCREEN 2: Schmerz in Ruhe */}
        {step === 'pain_rest' && (
          <motion.div
            key="pain_rest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schmerz in Ruhe · {region}</p>
              <h2 className="text-2xl font-bold text-white mb-1">Tut es gerade weh — ohne Bewegung?</h2>
              <p className="text-slate-400 text-sm">Wie du dich jetzt, in diesem Moment, fühlst</p>
            </div>

            <div className="glass rounded-2xl border border-slate-700 p-6 text-center">
              <div className="text-6xl font-black mb-1 transition-all duration-200">
                {getPainLabel(painRest).emoji}
              </div>
              <p className="text-xl font-bold text-white mb-1">{getPainLabel(painRest).text}</p>
              <p className="text-4xl font-black mt-3 mb-4" style={{
                color: painRest === 0 ? '#94a3b8' : painRest <= 2 ? '#22c55e' : painRest <= 4 ? '#f59e0b' : '#ef4444'
              }}>
                {painRest}
              </p>

              <input
                type="range"
                min={0}
                max={8}
                value={painRest}
                onChange={e => setPainRest(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #94a3b8 0%, #22c55e 15%, #f59e0b 55%, #ef4444 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0 — kein Schmerz</span>
                <span>8 — unerträglich</span>
              </div>
            </div>

            <Button
              onClick={handlePainRestConfirm}
              className="w-full h-14 font-bold text-base bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
            >
              Weiter →
            </Button>

            <button onClick={() => setStep('movement')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

        {/* SCREEN 3: Schmerz bei Bewegung */}
        {step === 'pain_move' && (
          <motion.div
            key="pain_move"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Schmerz bei Bewegung · {region}</p>
              <h2 className="text-2xl font-bold text-white mb-1">Und wenn du dich bewegst?</h2>
              <p className="text-slate-400 text-sm">Schmerz beim Bewegen, Beugen oder Belasten des Bereichs</p>
            </div>

            {painRest > 0 && (
              <div className="glass rounded-xl border border-slate-700 px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Schmerz in Ruhe:</span>
                <span className="font-bold text-white">{painRest}/8</span>
              </div>
            )}

            <div className="glass rounded-2xl border border-slate-700 p-6 text-center">
              <div className="text-6xl font-black mb-1 transition-all duration-200">
                {getPainLabel(painMove).emoji}
              </div>
              <p className="text-xl font-bold text-white mb-1">{getPainLabel(painMove).text}</p>
              <p className="text-4xl font-black mt-3 mb-4" style={{
                color: painMove === 0 ? '#94a3b8' : painMove <= 2 ? '#22c55e' : painMove <= 4 ? '#f59e0b' : '#ef4444'
              }}>
                {painMove}
              </p>

              <input
                type="range"
                min={0}
                max={8}
                value={painMove}
                onChange={e => setPainMove(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #94a3b8 0%, #22c55e 15%, #f59e0b 55%, #ef4444 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0 — kein Schmerz</span>
                <span>8 — unerträglich</span>
              </div>
            </div>

            <Button
              onClick={handlePainMoveConfirm}
              className={`w-full h-14 font-bold text-base ${
                Math.max(painRest, painMove) >= 7
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
              }`}
            >
              {Math.max(painRest, painMove) >= 7 ? '⚠️ Weiter zur Sicherheitsprüfung' : '✓ Analyse starten →'}
            </Button>

            <button onClick={() => setStep('pain_rest')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

        {/* SCREEN 4: Red Flag Check (nur bei max. Schmerz ≥ 7) */}
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
                <p className="text-amber-400 font-bold text-sm mb-1">Starker Schmerz erkannt</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Kurze Sicherheitsprüfung, damit wir den richtigen Weg für dich wählen.
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
                  {hasAnyRedFlag ? '→ Sicherheitsprotokoll anzeigen' : '→ Analyse starten'}
                </Button>
              </motion.div>
            )}

            <button onClick={() => setStep('pain_move')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}