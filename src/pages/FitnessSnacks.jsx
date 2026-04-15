import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Play, X, SkipForward, AlertTriangle, TrendingUp, Volume2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  hiit:           { label: 'HIIT' },
  zone2:          { label: 'Zone 2' },
  sprint:         { label: 'Sprint' },
  cold_exposure:  { label: 'Cold Exposure' },
  heat:           { label: 'Heat / Sauna' },
  breathwork:     { label: 'Breathwork' },
  strength_snack: { label: 'Strength' },
  mobility_snack: { label: 'Mobility' },
};

const READINESS_CONFIG = {
  green:  { label: 'Green State',  sub: 'System bereit für Hormesis',       dot: 'bg-zinc-300' },
  yellow: { label: 'Yellow State', sub: 'Neuronaler Reset & Mobilität',     dot: 'bg-zinc-400' },
  red:    { label: 'Red State',    sub: 'Parasympathischer Notausstieg',    dot: 'bg-zinc-500' },
};

const EQUIPMENT_LABELS = {
  none:            null,
  mat:             { label: 'Matte' },
  kettlebell:      { label: 'Kettlebell' },
  resistance_band: { label: 'Widerstandsband' },
  pull_up_bar:     { label: 'Klimmzugstange' },
  dumbbells:       { label: 'Kurzhanteln' },
  barbell:         { label: 'Langhantel' },
  foam_roller:     { label: 'Foam Roller' },
  lacrosse_ball:   { label: 'Lacrosse Ball' },
  box:             { label: 'Box' },
};

// ─── Snack Player ──────────────────────────────────────────────────────────────

function SnackPlayer({ snack, onClose, onFinish }) {
  const steps = snack.sequence || [];
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(steps[0]?.duration_seconds || 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feeling, setFeeling] = useState(null);
  const intervalRef = useRef(null);
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises-snack-player'],
    queryFn: () => base44.entities.Exercise.list(),
    staleTime: 5 * 60 * 1000
  });

  const currentStep = steps[stepIdx];
  const totalSteps = steps.length;
  const isCooldown = currentStep?.type === 'mfr_cooldown' || currentStep?.type === 'breath_cooldown';

  // Try to find Exercise data by title keyword match
  const getDetailedStep = () => {
    if (!currentStep) return currentStep;
    const stepTitle = (currentStep.title || '').toLowerCase();
    const matched = exercises.find(ex =>
      stepTitle.includes((ex.name || '').toLowerCase()) ||
      (ex.exercise_id || '').toLowerCase().includes(stepTitle.split(' ')[0].toLowerCase())
    );
    if (matched) {
      return {
        ...currentStep,
        description: matched.description || currentStep.instruction,
        axon_moment: matched.axon_moment,
        cues: matched.cues,
        breathing_instruction: matched.breathing_instruction,
        purpose_explanation: matched.purpose_explanation,
        benefits: matched.benefits,
        _exercise: matched
      };
    }
    return currentStep;
  };
  const detailedStep = getDetailedStep();

  // Parse markdown formatting
  const parseMarkdown = (text) => {
    if (!text) return text;
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (running && timeLeft === 0) {
      clearInterval(intervalRef.current);
      advanceStep();
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft]);

  const advanceStep = () => {
    if (stepIdx < totalSteps - 1) {
      const next = stepIdx + 1;
      setStepIdx(next);
      setTimeLeft(steps[next]?.duration_seconds || 60);
      setRunning(true);
    } else {
      setRunning(false);
      setDone(true);
    }
  };

  const skipStep = () => { clearInterval(intervalRef.current); advanceStep(); };
  const toggleTimer = () => setRunning(r => !r);
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = currentStep ? ((currentStep.duration_seconds - timeLeft) / currentStep.duration_seconds) * 100 : 0;

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-[#111111] flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 max-w-sm w-full">
          <div className="w-16 h-16 mx-auto rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-zinc-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Abgeschlossen</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Deine Mitochondrien haben soeben einen Wachstumssignal erhalten.
          </p>
          {snack.longevity_benefit && (
            <div className="rounded-xl border border-white/[0.06] p-4 bg-zinc-900">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Longevity Benefit</p>
              <p className="text-zinc-200 font-semibold text-sm">{snack.longevity_benefit}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-zinc-500 mb-3 uppercase tracking-widest">Wie war die Intensität?</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(v => (
                <button key={v} onClick={() => setFeeling(v)}
                  className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${feeling >= v ? 'bg-zinc-700 border-zinc-500 text-white' : 'border-white/[0.06] text-zinc-600 hover:text-zinc-400'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onFinish(feeling)}
            disabled={!feeling}
            className={`w-full h-12 rounded-xl font-bold text-sm transition-all ${feeling ? 'bg-zinc-200 hover:bg-white text-zinc-900' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
          >
            Abschliessen
          </button>
          <button onClick={onClose} className="text-sm text-zinc-600 hover:text-zinc-400">Schliessen</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111111] flex flex-col">
      {/* Header */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Snack Session</p>
            <h2 className="text-xl font-bold text-white">{snack.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-zinc-400 mb-4">{snack.subtitle}</div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            <span className="font-mono font-bold text-zinc-300">Step {stepIdx + 1}/{totalSteps}</span>
            {isCooldown && <span className="ml-2 text-teal-400">• COOL-DOWN</span>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-zinc-800">
        <motion.div className="h-full bg-zinc-400" style={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i < stepIdx ? 'bg-zinc-400' : i === stepIdx ? 'bg-zinc-200' : 'bg-zinc-800'
          }`} />
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">
        <div className="flex flex-col items-center justify-start space-y-6 w-full max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={stepIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6 w-full">
            {/* Timer + Sets/Reps – Großer & zentriert */}
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-56 h-56 mx-auto rounded-full flex flex-col items-center justify-center border-2 border-white/[0.1] bg-gradient-to-br from-zinc-900 to-zinc-800">
                <p className="text-7xl font-black tabular-nums text-white">{formatTime(timeLeft)}</p>
              </div>
              
              {/* Step-Übersicht */}
              <div className="w-full text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Step {stepIdx + 1} von {totalSteps}</p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setStepIdx(i)}
                      className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                        i === stepIdx
                          ? 'bg-zinc-200 text-zinc-900'
                          : i < stepIdx
                          ? 'bg-zinc-600 text-zinc-300'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
              
              {detailedStep?._exercise?.audio_url && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Audio abspielen</span>
                </button>
              )}
            </div>

            {/* Exercise Title + Phase */}
            <div className="text-center mb-2">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-1">{currentStep?.phase}</p>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">
                {detailedStep?.name || currentStep?.title}
              </h2>
            </div>

            {/* AXON Moment */}
            {detailedStep?.axon_moment && (
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-cyan-950/10 p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-cyan-400">💡</span>
                  </div>
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">AXON Moment</h5>
                    <p className="text-sm font-medium text-cyan-100 italic leading-relaxed">"{detailedStep.axon_moment}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ausführung */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-left">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ausführung</h5>
              <div className="text-sm text-slate-200 leading-relaxed space-y-2">
                {(detailedStep?.description || detailedStep?.instruction)?.split('\n').map((line, i) => (
                  line.trim() && <p key={i}>{parseMarkdown(line)}</p>
                ))}
              </div>
              {detailedStep?.breathing_instruction && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1">Atmung</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{detailedStep.breathing_instruction}</p>
                </div>
              )}
            </div>

            {/* Coach-Hinweise */}
            {(detailedStep?.cue || detailedStep?.cues?.length > 0) && (
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900 px-4 py-3 text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Coach-Hinweise</p>
                {detailedStep?.cue && (
                  <p className="text-sm text-zinc-300 font-medium italic mb-2">"{detailedStep.cue}"</p>
                )}
                {detailedStep?.cues?.map((cue, i) => (
                  <p key={i} className="text-xs text-zinc-400 leading-relaxed mb-1">• {cue}</p>
                ))}
              </div>
            )}

            {/* Purpose & Benefits */}
            {(detailedStep?.purpose_explanation || detailedStep?.benefits) && (
              <div className="grid grid-cols-1 gap-3">
                {detailedStep?.purpose_explanation && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Warum?</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{detailedStep.purpose_explanation}</p>
                  </div>
                )}
                {detailedStep?.benefits && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Du wirst spüren</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{detailedStep.benefits}</p>
                  </div>
                )}
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-10 space-y-3">
        <button onClick={toggleTimer}
          className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
            running ? 'bg-zinc-800 text-zinc-300 border border-white/[0.06]' : 'bg-zinc-200 hover:bg-white text-zinc-900'
          }`}>
          {running ? 'Pause' : <><Play className="w-5 h-5" /> {stepIdx === 0 && timeLeft === steps[0]?.duration_seconds ? 'Snack starten' : 'Weiter'}</>}
        </button>
        {totalSteps > 1 && (
          <button onClick={skipStep} className="w-full h-10 rounded-xl font-medium text-sm text-zinc-600 flex items-center justify-center gap-1 hover:text-zinc-400 transition-colors">
            <SkipForward className="w-4 h-4" /> Schritt überspringen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Snack Card ─────────────────────────────────────────────────────────────────

function SnackCard({ snack, isDoneToday, onStart, isLocked = false }) {
  const cfg = TYPE_CONFIG[snack.type] || { label: snack.type };
  const mainSteps = snack.sequence?.filter(s => s.type === 'exercise' || s.type === 'rest') || [];
  const cooldownSteps = snack.sequence?.filter(s => s.type === 'mfr_cooldown' || s.type === 'breath_cooldown') || [];

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-zinc-900/60 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{cfg.label}</span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">{snack.name}</h3>
            {snack.subtitle && <p className="text-xs text-zinc-500 mt-0.5">{snack.subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-sm font-bold text-zinc-300">{snack.duration_minutes} Min</span>
            </div>
            {isDoneToday && <CheckCircle2 className="w-5 h-5 text-zinc-400" />}
          </div>
        </div>

        {snack.required_equipment && snack.required_equipment !== 'none' && EQUIPMENT_LABELS[snack.required_equipment] && (
          <div className="mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06] text-zinc-400">
              {EQUIPMENT_LABELS[snack.required_equipment].label}
            </span>
          </div>
        )}

        {snack.longevity_benefit && (
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <p className="text-xs text-zinc-400">{snack.longevity_benefit}</p>
          </div>
        )}

        {(mainSteps.length > 0 || cooldownSteps.length > 0) && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {mainSteps.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06] text-zinc-500">
                {s.title}
              </span>
            ))}
            {cooldownSteps.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06] text-zinc-600">
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {isLocked ? (
        <div className="px-5 pb-4">
          <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
            🔒 Nur bei höherem Readiness-Status verfügbar
          </p>
        </div>
      ) : !isDoneToday ? (
        <div className="px-5 pb-5">
          <button onClick={() => onStart(snack)}
            className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] text-white">
            <Play className="w-4 h-4" /> Snack starten
          </button>
        </div>
      ) : (
        <div className="px-5 pb-4">
          <p className="text-xs text-zinc-500 font-medium">Abgeschlossen</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FitnessSnacks() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeSnack, setActiveSnack] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: snackData, isLoading } = useQuery({
    queryKey: ['personalizedSnacks', user?.email],
    queryFn: () => base44.functions.invoke('getPersonalizedSnacks', {}).then(r => r.data),
    enabled: !!user?.email,
    refetchOnWindowFocus: false,
  });

  const { data: allSnacks = [], isLoading: allLoading } = useQuery({
    queryKey: ['allSnacks'],
    queryFn: () => base44.entities.FitnessSnack.filter({ is_active: true }),
    enabled: !!user?.email,
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs = [] } = useQuery({
    queryKey: ['snackLogs', user?.email, today],
    queryFn: () => base44.entities.FitnessSnackLog.filter({ user_email: user.email, completed_date: today }),
    enabled: !!user?.email,
  });
  const { data: allLogs = [] } = useQuery({
    queryKey: ['snackLogsAll', user?.email],
    queryFn: () => base44.entities.FitnessSnackLog.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const doneTodayIds = new Set(todayLogs.map(l => l.snack_id));
  const readiness = snackData?.readiness_status || 'green';
  const rdCfg = READINESS_CONFIG[readiness] || READINESS_CONFIG.green;

  // Lücke 5.3: readiness_gate konsequent filtern
  const isSnackAllowed = (snack) => {
    const gate = snack.readiness_gate || 'any';
    if (gate === 'any') return true;
    if (gate === 'green') return readiness === 'green';
    if (gate === 'yellow') return readiness === 'green' || readiness === 'yellow';
    if (gate === 'red') return true; // red-gate = passt bei jedem Status
    return true;
  };

  const streakDays = (() => {
    if (!allLogs.length) return 0;
    const dates = [...new Set(allLogs.map(l => l.completed_date))].sort().reverse();
    let streak = 0;
    let check = new Date();
    for (const d of dates) {
      const diff = Math.round((check - new Date(d)) / 86400000);
      if (diff <= 1) { streak++; check = new Date(d); }
      else break;
    }
    return streak;
  })();

  const handleFinish = async (snack, feeling) => {
    if (!user?.email) return;
    await base44.entities.FitnessSnackLog.create({
      user_email: user.email, snack_id: snack.id, snack_name: snack.name,
      snack_type: snack.type, hormesis_type: snack.hormesis_type,
      duration_minutes: snack.duration_minutes, completed_date: today, feeling_after: feeling || 3,
    });
    queryClient.invalidateQueries({ queryKey: ['snackLogs'] });
    queryClient.invalidateQueries({ queryKey: ['snackLogsAll'] });
    base44.analytics.track({ eventName: 'fitness_snack_completed', properties: { snack_type: snack.type, duration: snack.duration_minutes } });
    setActiveSnack(null);
  };

  return (
    <>
      <AnimatePresence>
        {activeSnack && (
          <SnackPlayer
            snack={activeSnack}
            onClose={() => setActiveSnack(null)}
            onFinish={(feeling) => handleFinish(activeSnack, feeling)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#111111] pb-32">
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-1">Hormesis · Quick Sessions</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">Fitness Snacks</h1>
            <p className="text-sm text-zinc-500 mt-1">1–10 Min. hormetische Dosen für maximale zelluläre Rendite</p>
          </div>

          {/* Readiness Gate */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4 flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rdCfg.dot}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-200">{rdCfg.label}</p>
              <p className="text-xs text-zinc-500">{rdCfg.sub}</p>
            </div>
            {!snackData?.has_readiness_today && (
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded-lg">kein Check heute</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: streakDays, label: 'Streak' },
              { value: allLogs.length, label: 'Total Dosen' },
              { value: doneTodayIds.size, label: 'Heute' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-3 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Sensory Contrast */}
          {snackData?.sensory_contrast?.active && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Cortical Contrast aktiv</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{snackData.sensory_contrast.reason}</p>
            </div>
          )}

          {/* Cross-Education */}
          {snackData?.cross_education?.active && (
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Cross-Education Modus</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{snackData.cross_education.note}</p>
            </div>
          )}

          {/* Heute empfohlen (3 NMS-personalisierte) */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Heute empfohlen</p>

            {isLoading ? (
              <div className="rounded-xl border border-white/[0.06] p-12 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
              </div>
            ) : !snackData?.snacks?.length ? (
              <div className="rounded-xl border border-white/[0.06] p-8 text-center space-y-2">
                <AlertTriangle className="w-7 h-7 text-zinc-600 mx-auto" />
                <p className="text-zinc-500 text-sm">Noch keine Snacks im System.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snackData.snacks.map(snack => (
                  <SnackCard key={snack.id} snack={snack} isDoneToday={doneTodayIds.has(snack.id)} onStart={setActiveSnack} />
                ))}
              </div>
            )}
          </div>

          {/* Alle Snacks – Bibliothek */}
          {allSnacks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Alle Sessions</p>
              <div className="space-y-3">
                {allSnacks
                  .filter(s => !snackData?.snacks?.find(r => r.id === s.id))
                  .sort((a, b) => {
                    // Erlaubte Snacks zuerst, gesperrte ans Ende
                    const aOk = isSnackAllowed(a) ? 0 : 1;
                    const bOk = isSnackAllowed(b) ? 0 : 1;
                    return aOk - bOk;
                  })
                  .map(snack => (
                    <SnackCard
                      key={snack.id}
                      snack={snack}
                      isDoneToday={doneTodayIds.has(snack.id)}
                      onStart={setActiveSnack}
                      isLocked={!isSnackAllowed(snack)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Science Note */}
          <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Warum Hormesis?</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Kurze, kontrollierte Stressoren – HIIT, Kälte, Hitze, Kraft – aktivieren NRF2, AMPK und FOXO3: zelluläre Langlebigkeitsprogramme. Dein Readiness-Status entscheidet, welche Dosis dein System heute verträgt.{' '}
              <span className="text-zinc-400">"The dose makes the medicine." – Dr. Rhonda Patrick</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}