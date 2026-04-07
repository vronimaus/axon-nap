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

const MOVEMENT_LEVELS = [
  { value: 1, emoji: '🟢', label: 'Frei', sub: 'Flüssig, ohne Widerstand' },
  { value: 2, emoji: '🟡', label: 'Zäh', sub: 'Geht, aber mit Ausweichen' },
  { value: 3, emoji: '🟠', label: 'Eingeschränkt', sub: 'Nicht vollständig möglich' },
  { value: 4, emoji: '🔴', label: 'Blockiert', sub: 'Komme gar nicht in Position' },
];

function getPainLabel(v) {
  if (v === 0) return 'Kein Schmerz';
  if (v === 1) return 'Kaum wahrnehmbar';
  if (v === 2) return 'Leicht';
  if (v === 3) return 'Deutlich merkbar';
  if (v === 4) return 'Unangenehm';
  if (v === 5) return 'Stark';
  if (v === 6) return 'Sehr stark';
  if (v === 7) return 'Heftig';
  return 'Unerträglich';
}

function valueColor(v, max = 8) {
  if (v === 0) return '#94a3b8';
  const ratio = v / max;
  if (ratio <= 0.25) return '#22c55e';
  if (ratio <= 0.5) return '#f59e0b';
  return '#ef4444';
}

function getCyanSliderBg(value, max) {
  const pct = (value / max) * 100;
  return `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${pct}%, #1e293b ${pct}%, #1e293b 100%)`;
}

export default function SFMAQuickCheck({ region, onDecision }) {
  const [step, setStep] = useState('assess'); // 'assess' | 'redflags'
  const [movementLevel, setMovementLevel] = useState(1);
  const [painRest, setPainRest] = useState(0);
  const [painMove, setPainMove] = useState(0);
  const [flagAnswers, setFlagAnswers] = useState({});

  const hasAnyRedFlag = Object.values(flagAnswers).some(v => v === true);
  const allFlagsAnswered = Object.keys(flagAnswers).length === RED_FLAG_SYMPTOMS.length;
  const maxPain = Math.max(painRest, painMove);

  const handleAssessConfirm = () => {
    if (maxPain >= 7) {
      setStep('redflags');
    } else {
      onDecision({
        type: 'tune_up',
        symptomType: maxPain === 0 ? 'steifigkeit' : 'schmerz',
        movement_level: movementLevel,
        pain_rest: painRest,
        pain_move: painMove,
        nrs: maxPain,
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
      nrs: maxPain,
      region,
      flags: Object.entries(flagAnswers).filter(([, v]) => v === true).map(([k]) => k),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">

        {/* SCREEN 1: Alle 3 Werte auf einem Screen */}
        {step === 'assess' && (
          <motion.div
            key="assess"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <p className="text-xl text-slate-400">Problemzone: <span className="text-cyan-400 font-bold text-2xl">{region}</span></p>
              <h2 className="text-base font-semibold text-slate-300">Bewerte deine Einschränkung</h2>
            </div>

            {/* ① Bewegungsqualität */}
            {(() => {
              const mv = MOVEMENT_LEVELS[movementLevel - 1];
              return (
                <div className="glass rounded-2xl border border-slate-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">① Bewegungsqualität</p>
                    <span className="text-xs text-slate-400">Level {movementLevel}</span>
                  </div>
                  <input
                    type="range" min={1} max={4} step={1} value={movementLevel}
                    onChange={e => setMovementLevel(Number(e.target.value))}
                    className="w-full h-3 rounded-full cursor-pointer sfma-slider"
                    style={{ background: getCyanSliderBg(movementLevel - 1, 3), WebkitAppearance: 'none', appearance: 'none' }}
                  />
                  <div className="pt-1">
                    <p className="text-lg font-bold text-white">{mv.label}</p>
                    <p className="text-sm text-slate-400">{mv.sub}</p>
                  </div>
                </div>
              );
            })()}

            {/* ② Schmerzlevel in Ruhe */}
            <div className="glass rounded-2xl border border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">② Schmerzlevel in Ruhe</p>
                <span className="text-xs text-slate-400">Level {painRest}</span>
              </div>
              <input
                type="range" min={0} max={8} value={painRest}
                onChange={e => setPainRest(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer sfma-slider"
                style={{ background: getCyanSliderBg(painRest, 8), WebkitAppearance: 'none', appearance: 'none' }}
              />
              <div className="pt-1">
                <p className="text-lg font-bold" style={{ color: valueColor(painRest) }}>
                  {painRest} — {getPainLabel(painRest)}
                </p>
              </div>
            </div>

            {/* ③ Schmerzlevel bei Belastung */}
            <div className="glass rounded-2xl border border-slate-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">③ Schmerzlevel bei Belastung</p>
                <span className="text-xs text-slate-400">Level {painMove}</span>
              </div>
              <input
                type="range" min={0} max={8} value={painMove}
                onChange={e => setPainMove(Number(e.target.value))}
                className="w-full h-3 rounded-full cursor-pointer sfma-slider"
                style={{ background: getCyanSliderBg(painMove, 8), WebkitAppearance: 'none', appearance: 'none' }}
              />
              <div className="pt-1">
                <p className="text-lg font-bold" style={{ color: valueColor(painMove) }}>
                  {painMove} — {getPainLabel(painMove)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAssessConfirm}
              className={`w-full h-14 font-bold text-base ${
                maxPain >= 7
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
              }`}
            >
              {maxPain >= 7 ? '⚠️ Weiter zur Sicherheitsprüfung' : '✓ Analyse starten →'}
            </Button>
          </motion.div>
        )}

        {/* SCREEN 2: Red Flag Check (nur bei max. Schmerz ≥ 7) */}
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

            <button onClick={() => setStep('assess')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}