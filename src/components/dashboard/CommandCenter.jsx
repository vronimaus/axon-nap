import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveBodyMapInput from '../diagnosis/InteractiveBodyMapInput';
import ReadinessTrendChart from './ReadinessTrendChart';
import { X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Zap, Activity, BookOpen, Target, Watch, Clock, Play } from 'lucide-react';

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
    { label: 'Schlaf',  value: readiness?.sleep_quality },
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
const SLIDER_SENTENCES = {
  feeling_hardware: [
    '',
    'komplett blockiert',
    'sehr steif und unbeweglich',
    'ziemlich steif und schwer',
    'etwas eingeschränkt',
    'nicht ganz locker, aber ok',
    'ganz ok, leichte Spannung',
    'recht locker und beweglich',
    'gut beweglich und geschmeidig',
    'fast optimal, super Gefühl',
    'total locker und frei',
  ],
  focus_software: [
    '',
    'geistig komplett weg',
    'kaum präsent, zerstreut',
    'sehr unkonzentriert',
    'Fokus fällt schwer',
    'Fokus kommt und geht',
    'halbwegs klar, geht ok',
    'gut konzentriert und dabei',
    'fokussiert und klar',
    'sehr klar und leistungsfähig',
    'scharf fokussiert, auf den Punkt',
  ],
  energy_battery: [
    '',
    'komplett ausgepowert, leer',
    'kaum Energie, ausgelaugt',
    'sehr erschöpft und schwer',
    'müde und träge',
    'Energie ok, aber wenig',
    'Energie geht so',
    'gut geladen und bereit',
    'kraftvoll und energiegeladen',
    'sehr vital, echte Kraft',
    'volle Kraft, Bäume ausreißen',
  ],
  sleep_quality: [
    '',
    'kaum geschlafen',
    'nicht der Rede wert',
    'sehr schlecht geschlafen',
    'schlecht, nicht erholt',
    'durchwachsen geschlafen',
    'mittelmäßig, geht aber',
    'ganz ok geschlafen',
    'gut ausgeschlafen und erholt',
    'sehr gut geschlafen, fit',
    'ausgeschlafen, energiegeladen',
  ],
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
  const [forceShow, setForceShow] = useState(false);
  const queryClient = useQueryClient();

  if (todayReadiness && !forceShow) return (
    <div>
      <ReadinessRing readiness={todayReadiness} />
      <button
        onClick={() => { setForceShow(true); setExpanded(false); }}
        className="mt-3 w-full text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
      >
        ↺ Check wiederholen
      </button>
    </div>
  );

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
    // Notify other components that check is done (Dashboard handleDestinationClick reads this)
    window.dispatchEvent(new Event('readiness_check_saved'));
    queryClient.invalidateQueries({ queryKey: ['readinessToday'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['allReadinessChecks'], exact: false });
    setForceShow(false);
    setSaving(false);
  };

  return (
    <motion.div layout className="space-y-3 mt-1">
      {!expanded && (
        <p className="text-sm text-zinc-400">Schieber bewegen zum Starten</p>
      )}
      {SLIDERS.map(s => (
        <div key={s.key} className="space-y-2">
          <input
            type="range" min={1} max={10} step={1}
            value={values[s.key]}
            onChange={e => handleChange(s.key, Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer"
            style={{ accentColor: '#94a3b8' }}
          />
          <div className="min-h-[1.5rem]">
            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.p
                  key={values[s.key]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm text-white leading-snug"
                >
                  <span className="text-zinc-500">{s.label} —</span>{' '}
                  <span>{SLIDER_SENTENCES[s.key][values[s.key]]}</span>
                </motion.p>
              ) : (
                <motion.p key="label" className="text-xs text-zinc-600 uppercase tracking-wider">
                  {s.label}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
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
            <div className={`w-2.5 h-2.5 rounded-full transition-all`} style={{ backgroundColor: active ? '#398bf7' : isToday ? '#3f3f46' : '#27272a', boxShadow: active ? '0 0 6px rgba(57,139,247,0.5)' : 'none' }} />
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
  return <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">{children}</p>;
}

// ── Wearables & Body Metrics Tile ─────────────────────────────────────────────
function BiometricsTile({ user }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['neuroProfile', user?.email],
    queryFn: () => base44.entities.UserNeuroProfile.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const [form, setForm] = useState({});
  useEffect(() => {
    if (profile) setForm({
      height_cm: profile.height_cm || '',
      weight_kg: profile.weight_kg || '',
      hrv: profile.hrv_score || '',
      vo2max: profile.vo2max || '',
      resting_hr: profile.resting_hr || '',
      biological_sex: profile.biological_sex || '',
      date_of_birth: profile.date_of_birth || '',
    });
  }, [profile]);

  const age = form.date_of_birth
    ? Math.floor((new Date() - new Date(form.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const handleSave = async () => {
    setSaving(true);
    const data = {
      user_email: user.email,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      hrv_score: form.hrv ? Number(form.hrv) : undefined,
      vo2max: form.vo2max ? Number(form.vo2max) : undefined,
      resting_hr: form.resting_hr ? Number(form.resting_hr) : undefined,
      biological_sex: form.biological_sex || undefined,
      date_of_birth: form.date_of_birth || undefined,
    };
    if (profile?.id) await base44.entities.UserNeuroProfile.update(profile.id, data);
    else await base44.entities.UserNeuroProfile.create(data);
    queryClient.invalidateQueries({ queryKey: ['neuroProfile', user?.email] });
    setSaving(false);
    setEditing(false);
  };

  const metrics = [
    { label: 'Größe',      value: form.height_cm ? `${form.height_cm} cm` : '–' },
    { label: 'Gewicht',    value: form.weight_kg ? `${form.weight_kg} kg` : '–' },
    { label: 'Alter',      value: age ? `${age} J` : '–' },
    { label: 'HRV',        value: form.hrv ? `${form.hrv} ms` : '–' },
    { label: 'VO2Max',     value: form.vo2max ? `${form.vo2max}` : '–' },
    { label: 'Ruhepuls',   value: form.resting_hr ? `${form.resting_hr} bpm` : '–' },
  ];

  return (
    <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <TileLabel>Körperdaten</TileLabel>
        <button onClick={() => setEditing(e => !e)} className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">
          {editing ? 'Abbrechen' : 'Bearbeiten'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          {[
            { key: 'height_cm', label: 'Größe (cm)', type: 'number', placeholder: '180' },
            { key: 'weight_kg', label: 'Gewicht (kg)', type: 'number', placeholder: '80' },
            { key: 'date_of_birth', label: 'Geburtsdatum', type: 'date', placeholder: '' },
            { key: 'hrv', label: 'HRV (ms)', type: 'number', placeholder: '55' },
            { key: 'vo2max', label: 'VO2Max (ml/kg/min)', type: 'number', placeholder: '45' },
            { key: 'resting_hr', label: 'Ruhepuls (bpm)', type: 'number', placeholder: '60' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-0.5">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key] || ''}
                placeholder={f.placeholder}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full bg-zinc-800 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-[#398bf7]/50"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-0.5">Geschlecht</label>
            <select
              value={form.biological_sex || ''}
              onChange={e => setForm(v => ({ ...v, biological_sex: e.target.value }))}
              className="w-full bg-zinc-800 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none"
            >
              <option value="">–</option>
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="diverse">Divers</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full h-8 rounded-lg bg-[#398bf7]/20 hover:bg-[#398bf7]/30 text-[#398bf7] text-xs font-bold transition-all mt-1 disabled:opacity-50">
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {metrics.map(m => (
            <div key={m.label} className="flex justify-between items-baseline">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{m.label}</span>
              <span className="text-sm font-bold text-zinc-400">{m.value}</span>
            </div>
          ))}
          {form.biological_sex && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Geschlecht</span>
              <span className="text-sm font-bold text-zinc-400 capitalize">{form.biological_sex === 'male' ? 'Männlich' : form.biological_sex === 'female' ? 'Weiblich' : 'Divers'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main CommandCenter ──────────────────────────────────────────────────────────
export default function CommandCenter({ user, handleDestinationClick }) {
  const handleBodyMapSubmit = (mapData) => {
    const params = new URLSearchParams({
      mapData: JSON.stringify(mapData),
      region: mapData.region || '',
      step: 'sfma',
    });
    window.location.href = `/DiagnosisChat?${params.toString()}`;
  };

  const today = new Date().toISOString().split('T')[0];

  const { data: todayReadiness } = useQuery({
    queryKey: ['readinessToday', user?.email, today],
    queryFn: async () => {
      const res = await base44.entities.ReadinessCheck.filter({ user_email: user.email, check_date: today });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: snackData } = useQuery({
    queryKey: ['personalizedSnacks', user?.email],
    queryFn: () => base44.functions.invoke('getPersonalizedSnacks', {}).then(r => r.data),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: activeRehabPlan } = useQuery({
    queryKey: ['activeRehabPlan', user?.email],
    queryFn: async () => {
      const res = await base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: allChecks = [] } = useQuery({
    queryKey: ['allReadinessChecks', user?.email],
    queryFn: () => base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-created_date', 60),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const troughPattern = useMemo(() => {
    if (allChecks.length < 5) return null;
    const buckets = {};
    allChecks.forEach(c => {
      if (!c.created_date) return;
      const h = new Date(c.created_date).getHours();
      if (!buckets[h]) buckets[h] = [];
      buckets[h].push(c.readiness_score ?? 5);
    });
    let worstHour = null, worstAvg = 10;
    Object.entries(buckets).forEach(([h, scores]) => {
      if (scores.length < 3) return;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 6.5 && avg < worstAvg) { worstAvg = avg; worstHour = Number(h); }
    });
    return worstHour !== null ? { hour: worstHour, avg: Math.round(worstAvg * 10) / 10 } : null;
  }, [allChecks]);

  const currentHour = new Date().getHours();
  const isPreTrough = troughPattern && currentHour >= troughPattern.hour - 2 && currentHour < troughPattern.hour;

  // Map problem summary → Node ID
  const getNodeIdFromProblem = (problemSummary) => {
    if (!problemSummary) return null;
    const s = problemSummary.toLowerCase();
    if (s.includes('nacken') || s.includes('hals')) return 'N1';
    if (s.includes('schulter') || s.includes('arm')) return 'N2';
    if (s.includes('brust') || s.includes('brustkorb')) return 'N3';
    if (s.includes('rücken') || s.includes('wirbel') || s.includes('dorsal')) return 'N4';
    if (s.includes('lenden') || s.includes('lendenwirbel')) return 'N5';
    if (s.includes('knie')) return 'N6';
    if (s.includes('hüfte') || s.includes('becken')) return 'N7';
    if (s.includes('fuss') || s.includes('knöchel') || s.includes('fersen')) return 'N8';
    if (s.includes('wade') || s.includes('waden')) return 'N9';
    if (s.includes('ellbogen') || s.includes('unterarm')) return 'N10';
    if (s.includes('hand') || s.includes('finger')) return 'N11';
    if (s.includes('kopf') || s.includes('kiefer') || s.includes('atem')) return 'N12';
    return null;
  };

  const { data: knowledgeSnack } = useQuery({
    queryKey: ['knowledgeSnack', activeRehabPlan?.problem_summary],
    queryFn: async () => {
      const nodeId = getNodeIdFromProblem(activeRehabPlan?.problem_summary);
      if (!nodeId) return null;
      const res = await base44.entities.KnowledgeSnippet.filter({ node_id: nodeId, is_active: true }, '-created_date', 10);
      if (!res?.length) return null;
      return res[Math.floor(Math.random() * res.length)];
    },
    staleTime: 10 * 60 * 1000,
  });

  const rehabPhase = activeRehabPlan?.phases?.[activeRehabPlan.current_phase - 1];
  const nextExercise = rehabPhase?.exercises?.find(e => !e.completed);

  const h = new Date().getHours();
  const firstName = user?.full_name?.split(' ')[0];
  const greeting = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <>
      <div className="min-h-screen bg-[#111111] pb-28 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 pt-6">

          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-light text-white tracking-tight">
              {greeting}{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] mt-0.5">
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Desktop: 2-column grid. Mobile: single column */}
          <div className="flex flex-col md:flex-row gap-4 items-start">

            {/* LEFT: main content */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Row 1: Readiness */}
              <motion.div layout className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4">
                <TileLabel>System-Status</TileLabel>
                <InlineReadinessWidget user={user} todayReadiness={todayReadiness} />
              </motion.div>

              {/* Row 2: Quick Actions */}
              <div className={`grid gap-4 ${todayReadiness && todayReadiness.readiness_score >= 7 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <Tile onClick={() => handleDestinationClick('Quick Sessions', () => window.location.href = createPageUrl('FitnessSnacks'))}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-300">Quick Sessions</p>
                    <ChevronRight className="w-3 h-3 text-zinc-700" />
                  </div>
                </Tile>

                {(!todayReadiness || todayReadiness.readiness_score < 7) && (
                  <Tile onClick={() => window.location.href = createPageUrl('DiagnosisChat')}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-300">Tune-Up</p>
                      <ChevronRight className="w-3 h-3 text-zinc-700" />
                    </div>
                  </Tile>
                )}

                <Tile onClick={() => handleDestinationClick('Flow', () => window.location.href = createPageUrl('FlowRoutines'))}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-300">Routinen</p>
                    <ChevronRight className="w-3 h-3 text-zinc-700" />
                  </div>
                </Tile>
              </div>

              {/* Row 3: Heutige Quick-Snacks */}
              {snackData?.snacks?.length > 0 && (
                <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <TileLabel>Heute empfohlen</TileLabel>
                    <button
                      onClick={() => window.location.href = createPageUrl('FitnessSnacks')}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
                    >
                      Alle →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {snackData.snacks.map(snack => (
                      <button
                        key={snack.id}
                        onClick={() => window.location.href = createPageUrl('FitnessSnacks')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-white/[0.04] hover:border-white/[0.1] hover:bg-zinc-800 transition-all text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-zinc-700/60 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">{snack.name}</p>
                          <p className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {snack.duration_minutes} Min.
                          </p>
                        </div>
                        <Play className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <BiometricsTile user={user} />

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



              {/* Row 5: Readiness Trend */}
              <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4">
                <TileLabel>Readiness-Trend — 7 Tage</TileLabel>
                <p className="text-[10px] text-zinc-600 mb-2">Körper · Fokus · Energie</p>
                <ReadinessTrendChart checks={allChecks} />
              </div>

              {/* Energie-Muster Banner */}
              {troughPattern && (
                <div className={`bg-zinc-900/80 border rounded-2xl p-4 ${isPreTrough ? 'border-amber-500/30' : 'border-white/[0.06]'}`}>
                  <TileLabel>Energie-Muster erkannt</TileLabel>
                  <p className="text-sm text-zinc-300 mt-1">
                    Dein Tief liegt oft gegen{' '}
                    <span className="text-amber-400 font-bold">{troughPattern.hour}:00 Uhr</span>
                    {' '}(Ø {troughPattern.avg}/10)
                  </p>
                  {isPreTrough ? (
                    <p className="text-xs text-amber-400 mt-2 font-medium leading-relaxed">
                      → Jetzt präventiv handeln: Vagus Reset oder Quick Snack — bevor das Tief kommt.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-600 mt-1">AXON erkennt deine Rhythmen und wird dich rechtzeitig warnen.</p>
                  )}
                  {isPreTrough && (
                    <button
                      onClick={() => window.location.href = createPageUrl('FitnessSnacks')}
                      className="mt-3 text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Jetzt Quick Session starten →
                    </button>
                  )}
                </div>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => window.location.href = createPageUrl('AdminHub')}
                  className="w-full rounded-xl border border-white/[0.04] p-3 hover:border-white/[0.08] transition-all text-zinc-700 hover:text-zinc-500 text-[10px] font-medium uppercase tracking-widest"
                >
                  Admin Hub
                </button>
              )}
            </div>

            {/* RIGHT: Body Map sidebar */}
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-zinc-900/80 border border-white/[0.06] rounded-2xl p-4 md:sticky md:top-20">
                <TileLabel>Körper — Schmerz lokalisieren</TileLabel>
                <p className="text-xs text-zinc-600 mb-3">Tippe auf die exakte Stelle</p>
                <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
              </div>
            </div>

          </div>
        </div>
      </div>

    </>
  );
}