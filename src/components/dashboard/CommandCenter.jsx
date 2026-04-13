import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Zap, Activity, BookOpen, Target, Watch } from 'lucide-react';

// ── Readiness Ring ──────────────────────────────────────────────────────────────
function ReadinessRing({ readiness }) {
  const score = readiness?.readiness_score ?? null;
  const status = readiness?.readiness_status ?? null;

  const statusConfig = {
    green:  { label: 'Bereit',  color: '#10b981', text: 'text-emerald-400' },
    yellow: { label: 'Moderat', color: '#f59e0b', text: 'text-amber-400' },
    red:    { label: 'Erholen', color: '#ef4444', text: 'text-red-400' },
  };
  const cfg = statusConfig[status] || { label: '–', color: '#334155', text: 'text-slate-500' };

  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (score != null ? score / 10 : 0);

  const bars = [
    { label: 'Körper',  value: readiness?.feeling_hardware },
    { label: 'Fokus',   value: readiness?.focus_software },
    { label: 'Energie', value: readiness?.energy_battery },
  ];

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width="108" height="108" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          {score != null && (
            <circle cx="54" cy="54" r={radius} fill="none" stroke={cfg.color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={circ / 4}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tabular-nums">{score != null ? score.toFixed(1) : '–'}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{b.label}</span>
              <span className="text-[10px] text-slate-400 font-bold">{b.value ?? '–'}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              {b.value != null && (
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(b.value / 10) * 100}%`, backgroundColor: cfg.color, opacity: 0.7 }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline Readiness Widget ─────────────────────────────────────────────────────
const SLIDER_LABELS = {
  feeling_hardware: ['', 'Komplett blockiert', 'Sehr steif', 'Steif & schwer', 'Etwas eingeschränkt', 'Geht so', 'Ok, geht', 'Recht locker', 'Gut beweglich', 'Fast optimal', 'Locker & frei'],
  focus_software:   ['', 'Total weg', 'Kaum präsent', 'Sehr zerstreut', 'Unkonzentriert', 'Kommt und geht', 'Halbwegs klar', 'Gut dabei', 'Fokussiert', 'Sehr klar', 'Scharf & klar'],
  energy_battery:   ['', 'Komplett leer', 'Kaum da', 'Sehr erschöpft', 'Müde & schwer', 'Geht so', 'Ganz ok', 'Gut geladen', 'Kraftvoll', 'Sehr vital', 'Volle Kraft'],
  sleep_quality:    ['', 'Kein Schlaf', 'Fast nicht', 'Sehr schlecht', 'Schlecht', 'Durchwachsen', 'Mittel', 'Ganz ok', 'Gut geschlafen', 'Sehr gut', 'Perfekt erholt'],
};

const SLIDERS = [
  { key: 'feeling_hardware', label: 'Beweglichkeit'   },
  { key: 'focus_software',   label: 'Geistiger Fokus' },
  { key: 'energy_battery',   label: 'Körperenergie'   },
  { key: 'sleep_quality',    label: 'Schlaf'           },
];

function InlineReadinessWidget({ user, todayReadiness }) {
  const [values, setValues] = useState({ feeling_hardware: 5, focus_software: 5, energy_battery: 5, sleep_quality: 5 });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (todayReadiness) return <ReadinessRing readiness={todayReadiness} />;

  const handleChange = (key, val) => {
    if (!expanded) setExpanded(true);
    setValues(v => ({ ...v, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const avg = (values.feeling_hardware + values.focus_software + values.energy_battery + values.sleep_quality) / 4;
    const min = Math.min(values.feeling_hardware, values.focus_software, values.energy_battery, values.sleep_quality);
    const status = avg < 4 || min <= 2 ? 'red' : avg < 6.5 || min <= 4 ? 'yellow' : 'green';
    await base44.entities.ReadinessCheck.create({
      user_email: user.email,
      ...values,
      readiness_status: status,
      readiness_score: Math.round(avg * 10) / 10,
      check_date: today,
    });
    sessionStorage.setItem('readiness_check_done', today);
    queryClient.invalidateQueries({ queryKey: ['readinessToday'] });
    setSaving(false);
  };

  return (
    <motion.div layout className="space-y-3 mt-1">
      {!expanded && (
        <p className="text-sm text-zinc-400">Schieber bewegen zum Starten</p>
      )}
      {SLIDERS.map(s => (
        <div key={s.key}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{s.label}</span>
            <AnimatePresence mode="wait">
              {expanded && (
                <motion.span
                  key={values[s.key]}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-bold text-white"
                >
                  {SLIDER_LABELS[s.key][values[s.key]]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <input
            type="range" min={1} max={10} step={1}
            value={values[s.key]}
            onChange={e => handleChange(s.key, Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer"
            style={{ accentColor: '#94a3b8' }}
          />
        </div>
      ))}
      <AnimatePresence>
        {expanded && (
          <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={handleSave} disabled={saving}
            className="w-full h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Speichert…' : 'Speichern'}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Activity Dots (7 days) ──────────────────────────────────────────────────────
function ActivityDots({ logs }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const activeDates = new Set((logs || []).map(l => l.completed_date || l.created_date?.split('T')[0]));
  return (
    <div className="flex items-center justify-between">
      {days.map((day, i) => {
        const active = activeDates.has(day);
        const isToday = i === 6;
        return (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${active ? 'bg-slate-400' : isToday ? 'bg-slate-700 ring-1 ring-slate-600' : 'bg-slate-800'}`} />
            <span className="text-[9px] text-slate-600 uppercase">
              {['Mo','Di','Mi','Do','Fr','Sa','So'][(new Date(day).getDay() + 6) % 7]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Tile ────────────────────────────────────────────────────────────────────────
function Tile({ onClick, children }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4 text-left hover:border-white/[0.12] hover:bg-zinc-800/70 transition-all w-full">
      {children}
    </motion.button>
  );
}

function TileLabel({ children }) {
  return <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">{children}</p>;
}

// ── Main CommandCenter ──────────────────────────────────────────────────────────
export default function CommandCenter({ user, handleDestinationClick }) {
  const today = new Date().toISOString().split('T')[0];

  const { data: todayReadiness } = useQuery({
    queryKey: ['readinessToday', user?.email, today],
    queryFn: async () => {
      const res = await base44.entities.ReadinessCheck.filter({ user_email: user.email, check_date: today });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: activeRehabPlan } = useQuery({
    queryKey: ['activeRehabPlan', user?.email],
    queryFn: async () => {
      const res = await base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: routineLogs = [] } = useQuery({
    queryKey: ['routineLogsWeek', user?.email],
    queryFn: () => base44.entities.RoutineHistory.list('-created_date', 30),
    enabled: !!user?.email,
  });

  const { data: snackLogs = [] } = useQuery({
    queryKey: ['snackLogsWeek', user?.email],
    queryFn: () => base44.entities.FitnessSnackLog.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: knowledgeSnack } = useQuery({
    queryKey: ['knowledgeSnack'],
    queryFn: async () => {
      const res = await base44.entities.KnowledgeArticle.list('-created_date', 5);
      if (!res?.length) return null;
      return res[Math.floor(Math.random() * res.length)];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Streak
  const allActivityDates = new Set([
    ...routineLogs.map(l => l.created_date?.split('T')[0]).filter(Boolean),
    ...snackLogs.map(l => l.completed_date).filter(Boolean),
  ]);
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (allActivityDates.has(d.toISOString().split('T')[0])) streak++;
    else if (i > 0) break;
  }

  const allLogs = [
    ...routineLogs.map(l => ({ completed_date: l.created_date?.split('T')[0] })),
    ...snackLogs,
  ];

  const rehabPhase = activeRehabPlan?.phases?.[activeRehabPlan.current_phase - 1];
  const nextExercise = rehabPhase?.exercises?.find(e => !e.completed);

  const h = new Date().getHours();
  const firstName = user?.full_name?.split(' ')[0];
  const greeting = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <div className="min-h-screen bg-[#111111] pb-28 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-light text-white tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] mt-0.5">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Row 1: Readiness (inline check) + Streak */}
        <div className="grid grid-cols-3 gap-3 items-start">
          <motion.div layout className="col-span-2 bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4">
            <TileLabel>System-Status</TileLabel>
            <InlineReadinessWidget user={user} todayReadiness={todayReadiness} />
          </motion.div>

          <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
            <TileLabel>Streak</TileLabel>
            <div>
              <p className="text-4xl font-black text-white tabular-nums leading-none">{streak}</p>
              <p className="text-[10px] text-zinc-600 mt-1">Tage aktiv</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-slate-500 mt-2" style={{ opacity: streak > 0 ? 1 : 0.2 }} />
          </div>
        </div>

        {/* Row 2: Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Tile onClick={() => handleDestinationClick('Quick Sessions', () => window.location.href = createPageUrl('FitnessSnacks'))}>
            <Zap className="w-4 h-4 text-zinc-600 mb-3" />
            <TileLabel>Snacks</TileLabel>
            <p className="text-sm font-semibold text-zinc-300 leading-tight">Quick Sessions</p>
            <ChevronRight className="w-3 h-3 text-zinc-700 mt-2" />
          </Tile>

          <Tile onClick={() => handleDestinationClick('Rehab', () => window.location.href = createPageUrl('DiagnosisChat'))}>
            <Target className="w-4 h-4 text-zinc-600 mb-3" />
            <TileLabel>Rehab</TileLabel>
            <p className="text-sm font-semibold text-zinc-300 leading-tight">
              {activeRehabPlan ? `Phase ${activeRehabPlan.current_phase}` : 'Diagnose'}
            </p>
            <ChevronRight className="w-3 h-3 text-zinc-700 mt-2" />
          </Tile>

          <Tile onClick={() => handleDestinationClick('Flow', () => window.location.href = createPageUrl('FlowRoutines'))}>
            <Activity className="w-4 h-4 text-zinc-600 mb-3" />
            <TileLabel>Flow</TileLabel>
            <p className="text-sm font-semibold text-zinc-300 leading-tight">Routinen</p>
            <ChevronRight className="w-3 h-3 text-zinc-700 mt-2" />
          </Tile>
        </div>

        {/* Row 3: Rehab next + Wissen */}
        <div className="grid grid-cols-2 gap-3">
          <Tile onClick={() => window.location.href = createPageUrl('RehabPlan')}>
            <TileLabel>Nächste Übung</TileLabel>
            {nextExercise ? (
              <>
                <p className="text-sm font-semibold text-zinc-200 leading-tight mt-1">{nextExercise.name}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{nextExercise.sets_reps_tempo || ''}</p>
              </>
            ) : activeRehabPlan ? (
              <p className="text-xs text-zinc-500 mt-1">Phase abgeschlossen ✓</p>
            ) : (
              <p className="text-xs text-zinc-600 mt-1">Noch kein aktiver Plan</p>
            )}
          </Tile>

          <Tile onClick={() => window.location.href = createPageUrl('Wissen')}>
            <BookOpen className="w-4 h-4 text-zinc-600 mb-2" />
            <TileLabel>Wissen</TileLabel>
            {knowledgeSnack ? (
              <>
                <p className="text-xs font-semibold text-zinc-300 leading-snug line-clamp-2">{knowledgeSnack.title}</p>
                <p className="text-[10px] text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {knowledgeSnack.summary || knowledgeSnack.content?.slice(0, 80)}
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-600">Zur Wissensbibliothek →</p>
            )}
          </Tile>
        </div>

        {/* Row 4: Wearables placeholder */}
        <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4">
          <Watch className="w-5 h-5 text-zinc-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <TileLabel>Wearables</TileLabel>
            <p className="text-xs text-zinc-500">Apple Watch · Garmin · Whoop · Oura</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700 border border-white/[0.04] px-2 py-1 rounded-full whitespace-nowrap">Bald verfügbar</span>
        </div>

        {/* Row 5: 7-Day Activity */}
        <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4">
          <TileLabel>Aktivität — letzte 7 Tage</TileLabel>
          <div className="mt-3">
            <ActivityDots logs={allLogs} />
          </div>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => window.location.href = createPageUrl('AdminHub')}
            className="w-full rounded-xl border border-white/[0.04] p-3 hover:border-white/[0.08] transition-all text-zinc-700 hover:text-zinc-500 text-[10px] font-medium uppercase tracking-widest"
          >
            Admin Hub
          </button>
        )}
      </div>
    </div>
  );
}