import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle2, ChevronRight, TrendingUp, Play, X, SkipForward, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  hiit:           { label: 'HIIT',          icon: '🔥', color: 'orange' },
  zone2:          { label: 'Zone 2',         icon: '🚴', color: 'blue' },
  sprint:         { label: 'Sprint',         icon: '⚡', color: 'yellow' },
  cold_exposure:  { label: 'Cold Exposure',  icon: '❄️', color: 'cyan' },
  heat:           { label: 'Heat / Sauna',   icon: '🌡️', color: 'red' },
  breathwork:     { label: 'Breathwork',     icon: '💨', color: 'purple' },
  strength_snack: { label: 'Strength',       icon: '💪', color: 'emerald' },
  mobility_snack: { label: 'Mobility',       icon: '🧘', color: 'teal' },
};

const READINESS_CONFIG = {
  green:  { label: 'Green State',  sub: 'System bereit für Hormesis', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  yellow: { label: 'Yellow State', sub: 'Neuronaler Reset & Mobilität', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  red:    { label: 'Red State',    sub: 'Parasympathischer Notausstieg', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', dot: 'bg-red-400' },
};

const EQUIPMENT_LABELS = {
  none:            null,
  mat:             { label: 'Matte', icon: '🧘' },
  kettlebell:      { label: 'Kettlebell', icon: '🔔' },
  resistance_band: { label: 'Widerstandsband', icon: '🟡' },
  pull_up_bar:     { label: 'Klimmzugstange', icon: '🔝' },
  dumbbells:       { label: 'Kurzhanteln', icon: '💪' },
  barbell:         { label: 'Langhantel', icon: '🏋️' },
  foam_roller:     { label: 'Foam Roller', icon: '🔵' },
  lacrosse_ball:   { label: 'Lacrosse Ball', icon: '⚫' },
  box:             { label: 'Box', icon: '📦' },
};

const STEP_TYPE_LABEL = {
  exercise:      { label: 'WORKOUT', color: 'text-orange-400' },
  rest:          { label: 'PAUSE',   color: 'text-slate-400' },
  mfr_cooldown:  { label: 'COOL-DOWN · MFR', color: 'text-cyan-400' },
  breath_cooldown: { label: 'COOL-DOWN · ATEM', color: 'text-purple-400' },
};

const COLORS = {
  orange:  { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', btn: 'bg-orange-500 hover:bg-orange-600 text-white' },
  blue:    { border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300',   btn: 'bg-blue-500 hover:bg-blue-600 text-white' },
  yellow:  { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', btn: 'bg-yellow-500 hover:bg-yellow-600 text-black' },
  cyan:    { border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300',   btn: 'bg-cyan-500 hover:bg-cyan-600 text-black' },
  red:     { border: 'border-red-500/30',    bg: 'bg-red-500/10',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-300',     btn: 'bg-red-500 hover:bg-red-600 text-white' },
  purple:  { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300', btn: 'bg-purple-500 hover:bg-purple-600 text-white' },
  emerald: { border: 'border-emerald-500/30',bg: 'bg-emerald-500/10',text: 'text-emerald-400',badge: 'bg-emerald-500/20 text-emerald-300', btn: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  teal:    { border: 'border-teal-500/30',   bg: 'bg-teal-500/10',   text: 'text-teal-400',   badge: 'bg-teal-500/20 text-teal-300',   btn: 'bg-teal-500 hover:bg-teal-600 text-white' },
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

  const currentStep = steps[stepIdx];
  const cfg = TYPE_CONFIG[snack.type] || TYPE_CONFIG.hiit;
  const colors = COLORS[snack.color_class || cfg.color] || COLORS.orange;
  const totalSteps = steps.length;

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

  const skipStep = () => {
    clearInterval(intervalRef.current);
    advanceStep();
  };

  const toggleTimer = () => setRunning(r => !r);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = currentStep ? ((currentStep.duration_seconds - timeLeft) / currentStep.duration_seconds) * 100 : 0;

  const stepTypeInfo = currentStep ? STEP_TYPE_LABEL[currentStep.type] || STEP_TYPE_LABEL.exercise : null;
  const isCooldown = currentStep?.type === 'mfr_cooldown' || currentStep?.type === 'breath_cooldown';

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 max-w-sm w-full">
          <div className="text-6xl">🏆</div>
          <h2 className="text-2xl font-black text-white">Dose verabreicht!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Deine Mitochondrien haben soeben einen Wachstumssignal erhalten. Zelluläre Rendite gebucht.
          </p>
          {snack.longevity_benefit && (
            <div className="glass rounded-xl border border-emerald-500/30 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Longevity Benefit</p>
              <p className="text-emerald-400 font-bold">{snack.longevity_benefit}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Wie war die Intensität?</p>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(v => (
                <button key={v} onClick={() => setFeeling(v)}
                  className={`text-2xl transition-transform ${feeling >= v ? 'scale-110' : 'opacity-30 hover:opacity-60'}`}>
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onFinish(feeling)}
            disabled={!feeling}
            className={`w-full h-12 rounded-xl font-black text-sm transition-all ${feeling ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            ✓ Abschließen
          </button>
          <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-400">Schließen</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${stepTypeInfo?.color || 'text-slate-400'}`}>
            {stepTypeInfo?.label} · {stepIdx + 1} / {totalSteps}
          </p>
          <h2 className="text-lg font-black text-white">{currentStep?.title}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className={`h-full ${isCooldown ? 'bg-cyan-500' : 'bg-orange-500'}`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step overview pills */}
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? (isCooldown ? 'bg-cyan-500' : 'bg-orange-500') : 'bg-slate-700'
          }`} />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6 w-full max-w-sm">
            {/* Timer */}
            <div className={`w-36 h-36 mx-auto rounded-full flex items-center justify-center border-4 ${
              isCooldown ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-orange-500/50 bg-orange-500/10'
            }`}>
              <div>
                <p className={`text-4xl font-black tabular-nums ${isCooldown ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {formatTime(timeLeft)}
                </p>
                {currentStep?.sets && currentStep?.reps && (
                  <p className="text-xs text-slate-400 mt-1">{currentStep.sets}×{currentStep.reps}</p>
                )}
              </div>
            </div>

            {/* Instruction */}
            <p className="text-base text-slate-200 leading-relaxed font-medium">{currentStep?.instruction}</p>

            {/* Cue */}
            {currentStep?.cue && (
              <div className="glass rounded-xl border border-slate-700/50 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Coach-Cue</p>
                <p className="text-sm text-slate-300 font-medium italic">"{currentStep.cue}"</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="px-6 pb-10 space-y-3">
        <button onClick={toggleTimer}
          className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
            running
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : (isCooldown ? 'bg-cyan-500 hover:bg-cyan-600 text-black' : 'bg-orange-500 hover:bg-orange-600 text-white')
          }`}>
          {running ? '⏸ Pause' : <><Play className="w-5 h-5" /> {stepIdx === 0 && timeLeft === steps[0]?.duration_seconds ? 'Snack starten' : 'Weiter'}</>}
        </button>
        {totalSteps > 1 && (
          <button onClick={skipStep} className="w-full h-10 rounded-xl font-medium text-sm text-slate-500 flex items-center justify-center gap-1 hover:text-slate-300 transition-colors">
            <SkipForward className="w-4 h-4" /> Schritt überspringen
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Snack Card ─────────────────────────────────────────────────────────────────

function SnackCard({ snack, isDoneToday, onStart }) {
  const cfg = TYPE_CONFIG[snack.type] || TYPE_CONFIG.hiit;
  const colors = COLORS[snack.color_class || cfg.color] || COLORS.orange;
  const hasSequence = snack.sequence?.length > 0;
  const mainSteps = snack.sequence?.filter(s => s.type === 'exercise' || s.type === 'rest') || [];
  const cooldownSteps = snack.sequence?.filter(s => s.type === 'mfr_cooldown' || s.type === 'breath_cooldown') || [];

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border glass ${colors.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${colors.bg}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{cfg.label}</span>
            </div>
            <h3 className="text-base font-black text-white leading-tight">{snack.name}</h3>
            {snack.subtitle && <p className="text-xs text-slate-400 mt-0.5">{snack.subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-bold text-white">{snack.duration_minutes} Min</span>
            </div>
            {isDoneToday && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>
        </div>

        {/* Equipment Badge */}
        {snack.required_equipment && snack.required_equipment !== 'none' && EQUIPMENT_LABELS[snack.required_equipment] && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/70 border border-slate-600/50 text-slate-300 flex items-center gap-1">
              {EQUIPMENT_LABELS[snack.required_equipment].icon} {EQUIPMENT_LABELS[snack.required_equipment].label}
            </span>
          </div>
        )}

        {snack.longevity_benefit && (
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">{snack.longevity_benefit}</p>
          </div>
        )}

        {/* Sequence preview */}
        {hasSequence && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {mainSteps.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-medium border border-orange-500/20">
                {s.title}
              </span>
            ))}
            {cooldownSteps.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20">
                🧊 {s.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {!isDoneToday && (
        <div className="px-5 pb-5">
          <button onClick={() => onStart(snack)}
            className={`w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${colors.btn}`}>
            <Play className="w-4 h-4" /> Snack starten
          </button>
        </div>
      )}
      {isDoneToday && (
        <div className="px-5 pb-4">
          <p className="text-xs text-emerald-400 font-bold">✓ Zelluläre Rendite gebucht</p>
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
      user_email: user.email,
      snack_id: snack.id,
      snack_name: snack.name,
      snack_type: snack.type,
      hormesis_type: snack.hormesis_type,
      duration_minutes: snack.duration_minutes,
      completed_date: today,
      feeling_after: feeling || 3,
    });
    queryClient.invalidateQueries({ queryKey: ['snackLogs'] });
    queryClient.invalidateQueries({ queryKey: ['snackLogsAll'] });
    base44.analytics.track({ eventName: 'fitness_snack_completed', properties: { snack_type: snack.type, duration: snack.duration_minutes } });
    setActiveSnack(null);
  };

  return (
    <>
      {/* Snack Player overlay */}
      <AnimatePresence>
        {activeSnack && (
          <SnackPlayer
            snack={activeSnack}
            onClose={() => setActiveSnack(null)}
            onFinish={(feeling) => handleFinish(activeSnack, feeling)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400 mb-1">neurometa · hormesis</p>
            <h1 className="text-3xl font-black text-white tracking-tight">Fitness Snacks</h1>
            <p className="text-sm text-slate-400 mt-1">1–10 Min. Hormetische Dosen für maximale Zelluläre Rendite</p>
          </div>

          {/* Readiness Gate */}
          <div className={`glass rounded-2xl border ${rdCfg.border} p-4 flex items-center gap-4`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${rdCfg.dot} shadow-[0_0_12px_currentColor]`} />
            <div className="flex-1">
              <p className={`text-sm font-black ${rdCfg.color}`}>{rdCfg.label}</p>
              <p className="text-xs text-slate-400">{rdCfg.sub}</p>
            </div>
            {!snackData?.has_readiness_today && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">kein Check heute</span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-2xl border border-orange-500/20 p-3 text-center">
              <p className="text-2xl font-black text-orange-400">{streakDays}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Streak</p>
            </div>
            <div className="glass rounded-2xl border border-cyan-500/20 p-3 text-center">
              <p className="text-2xl font-black text-cyan-400">{allLogs.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Dosen</p>
            </div>
            <div className="glass rounded-2xl border border-emerald-500/20 p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{doneTodayIds.size}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Heute</p>
            </div>
          </div>

          {/* Sensory Contrast Badge */}
          {snackData?.sensory_contrast?.active && (
            <div className="glass rounded-2xl border border-purple-500/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">⚡ Cortical Contrast aktiv</p>
              <p className="text-xs text-slate-300 leading-relaxed">{snackData.sensory_contrast.reason}</p>
            </div>
          )}

          {/* Cross-Education Notice */}
          {snackData?.cross_education?.active && (
            <div className="glass rounded-2xl border border-yellow-500/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-1">🔄 Cross-Education Modus</p>
              <p className="text-xs text-slate-300 leading-relaxed">{snackData.cross_education.note}</p>
            </div>
          )}

          {/* Snacks */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
              Deine heutigen Hormetic Doses
            </p>

            {isLoading ? (
              <div className="glass rounded-2xl border border-slate-700/50 p-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !snackData?.snacks?.length ? (
              <div className="glass rounded-2xl border border-slate-700/50 p-8 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Noch keine Snacks im System.</p>
                <p className="text-slate-500 text-xs">Admin kann Snacks im AdminHub anlegen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snackData.snacks.map(snack => (
                  <SnackCard
                    key={snack.id}
                    snack={snack}
                    isDoneToday={doneTodayIds.has(snack.id)}
                    onStart={setActiveSnack}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Science Note */}
          <div className="glass rounded-2xl border border-slate-700/30 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">🔬 Warum Hormesis?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kurze, kontrollierte Stressoren – HIIT, Kälte, Hitze, Kraft – aktivieren NRF2, AMPK und FOXO3: zelluläre Langlebigkeitsprogramme. Dein Readiness-Status entscheidet, welche Dosis dein System heute verträgt.{' '}
              <span className="text-slate-300 font-medium">Dr. Rhonda Patrick: "The dose makes the medicine."</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}