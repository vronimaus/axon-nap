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

// Separate Intensitäts-Beschreibungen je nach Typ
const STIFFNESS_LEVELS = [
  { value: 1, emoji: '🔵', label: 'Kaum merkbar', sub: 'Ein kleines Gefühl von Schwere oder Enge — aber keine Einschränkung' },
  { value: 2, emoji: '🔵', label: 'Leicht eingerostet', sub: 'Morgens oder nach langem Sitzen etwas steif, gibt sich schnell' },
  { value: 3, emoji: '🔵', label: 'Spürbar eingeschränkt', sub: 'Bestimmte Bewegungen sind deutlich enger — du merkst es beim Alltag' },
  { value: 4, emoji: '🔵', label: 'Stark eingeschränkt', sub: 'Viele Bewegungen klappen nicht richtig — du weichst automatisch aus' },
  { value: 5, emoji: '🔵', label: 'Extrem steif', sub: 'Kaum Bewegung möglich — der Bereich fühlt sich wie blockiert an' },
];

const PAIN_LEVELS = [
  { value: 1, emoji: '🟢', label: 'Kaum wahrnehmbar', sub: 'Ein leises Ziehen — du bemerkst es, aber es stört dich nicht' },
  { value: 2, emoji: '🟢', label: 'Leicht', sub: 'Merkbar, aber du kannst problemlos damit umgehen' },
  { value: 3, emoji: '🟡', label: 'Moderat', sub: 'Unangenehm — du denkst öfter daran, es lenkt ein bisschen ab' },
  { value: 4, emoji: '🟡', label: 'Deutlich', sub: 'Schmerzt beim Bewegen, du schonst den Bereich instinktiv' },
  { value: 5, emoji: '🟠', label: 'Stark', sub: 'Kontinuierlicher Schmerz, der dich merklich einschränkt' },
  { value: 6, emoji: '🟠', label: 'Sehr stark', sub: 'Schwer zu ignorieren — du veränderst deinen Alltag deswegen' },
  { value: 7, emoji: '🔴', label: 'Heftig', sub: 'Starker Schmerz, der alles überschattet' },
  { value: 8, emoji: '🔴', label: 'Sehr heftig', sub: 'Kaum etwas anderes möglich — du brauchst Entlastung' },
  { value: 9, emoji: '🔴', label: 'Unerträglich', sub: 'Extrem — normale Aktivitäten fast unmöglich' },
  { value: 10, emoji: '🔴', label: 'Schlimmstvorstellbar', sub: 'Der schlimmste Schmerz, den du dir vorstellen kannst' },
];

export default function SFMAQuickCheck({ region, onDecision }) {
  const [step, setStep] = useState('type');       // 'type' | 'intensity' | 'redflags'
  const [symptomType, setSymptomType] = useState(null); // 'stiffness' | 'pain'
  const [intensity, setIntensity] = useState(null);
  const [flagAnswers, setFlagAnswers] = useState({});

  const hasAnyRedFlag = Object.values(flagAnswers).some(v => v === true);
  const allFlagsAnswered = Object.keys(flagAnswers).length === RED_FLAG_SYMPTOMS.length;

  const levels = symptomType === 'stiffness' ? STIFFNESS_LEVELS : PAIN_LEVELS;
  const selectedLevel = levels.find(l => l.value === intensity);

  const handleTypeSelect = (type) => {
    setSymptomType(type);
    setIntensity(null);
    setStep('intensity');
  };

  const handleIntensitySelect = (val) => {
    setIntensity(val);
  };

  const handleIntensityConfirm = () => {
    // Red flag check: nur bei Schmerz ≥ 7
    if (symptomType === 'pain' && intensity >= 7) {
      setStep('redflags');
    } else {
      onDecision({
        type: 'tune_up',
        symptomType: symptomType === 'stiffness' ? 'steifigkeit' : 'schmerz',
        nrs: symptomType === 'stiffness' ? 0 : intensity,
        stiffness_level: symptomType === 'stiffness' ? intensity : null,
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
      nrs: intensity,
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

        {/* SCREEN 1: Typ wählen */}
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

            <div className="space-y-3">
              <button
                onClick={() => handleTypeSelect('stiffness')}
                className="w-full glass rounded-2xl border border-cyan-500/30 p-5 hover:border-cyan-500/60 active:scale-[0.98] transition-all text-left flex items-center gap-4"
              >
                <span className="text-4xl">🔵</span>
                <div>
                  <p className="text-white font-bold text-lg">Steifigkeit / Enge</p>
                  <p className="text-slate-400 text-sm mt-0.5">Schwer, eingerostet, blockiert — aber kein echter Schmerz</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('pain')}
                className="w-full glass rounded-2xl border border-red-500/30 p-5 hover:border-red-500/60 active:scale-[0.98] transition-all text-left flex items-center gap-4"
              >
                <span className="text-4xl">🔴</span>
                <div>
                  <p className="text-white font-bold text-lg">Schmerz</p>
                  <p className="text-slate-400 text-sm mt-0.5">Stechend, brennend, ziehend oder dumpf — eindeutig Schmerz</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: Intensität wählen (je nach Typ andere Skala) */}
        {step === 'intensity' && (
          <motion.div
            key="intensity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                {symptomType === 'stiffness' ? 'Steifigkeit' : 'Schmerz'} · {region}
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                {symptomType === 'stiffness' ? 'Wie stark ist die Einschränkung?' : 'Wie stark ist der Schmerz?'}
              </h2>
              <p className="text-slate-400 text-sm">Wähle das, was am besten passt</p>
            </div>

            <div className="space-y-2">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleIntensitySelect(level.value)}
                  className={`w-full rounded-xl border p-3 text-left flex items-center gap-3 transition-all active:scale-[0.98] ${
                    intensity === level.value
                      ? 'border-cyan-500/60 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{level.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{level.value}</span>
                      <p className={`font-bold text-sm ${intensity === level.value ? 'text-cyan-300' : 'text-white'}`}>
                        {level.label}
                      </p>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 leading-snug">{level.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {intensity !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleIntensityConfirm}
                  className={`w-full h-14 font-bold text-base ${
                    symptomType === 'pain' && intensity >= 7
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                  }`}
                >
                  {symptomType === 'pain' && intensity >= 7
                    ? '⚠️ Weiter zur Sicherheitsprüfung'
                    : '✓ Tune-Up starten →'}
                </Button>
              </motion.div>
            )}

            <button onClick={() => setStep('type')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

        {/* SCREEN 3: Red Flag Check (nur bei Schmerz ≥ 7) */}
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
                <p className="text-amber-400 font-bold text-sm mb-1">Starker Schmerz ({intensity}/10) erkannt</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Kurze Sicherheitsprüfung — damit wir den richtigen Weg für dich wählen.
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

            <button onClick={() => setStep('intensity')} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Zurück
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}