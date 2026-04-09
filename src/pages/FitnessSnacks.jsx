import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle2, Flame, Wind, Thermometer, Activity, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TYPE_CONFIG = {
  hiit:           { label: 'HIIT',           icon: '🔥', color: 'orange' },
  zone2:          { label: 'Zone 2',          icon: '🚴', color: 'blue' },
  sprint:         { label: 'Sprint',          icon: '⚡', color: 'yellow' },
  cold_exposure:  { label: 'Cold Exposure',   icon: '❄️', color: 'cyan' },
  heat:           { label: 'Heat / Sauna',    icon: '🌡️', color: 'red' },
  breathwork:     { label: 'Breathwork',      icon: '💨', color: 'purple' },
  strength_snack: { label: 'Strength Snack',  icon: '💪', color: 'emerald' },
  mobility_snack: { label: 'Mobility Snack',  icon: '🧘', color: 'teal' },
};

const HORMESIS_LABELS = {
  thermal:    'Thermischer Stress',
  hypoxic:    'Hypoxischer Stress',
  mechanical: 'Mechanischer Stress',
  metabolic:  'Metabolischer Stress',
  oxidative:  'Oxidativer Stress',
};

const COLOR_CLASSES = {
  orange:  { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
  blue:    { border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300' },
  yellow:  { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
  cyan:    { border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300' },
  red:     { border: 'border-red-500/30',    bg: 'bg-red-500/10',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-300' },
  purple:  { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  emerald: { border: 'border-emerald-500/30',bg: 'bg-emerald-500/10',text: 'text-emerald-400',badge: 'bg-emerald-500/20 text-emerald-300' },
  teal:    { border: 'border-teal-500/30',   bg: 'bg-teal-500/10',   text: 'text-teal-400',   badge: 'bg-teal-500/20 text-teal-300' },
};

function getAgeFromBirthdate(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function filterSnacksForUser(snacks, profile) {
  const age = profile ? getAgeFromBirthdate(profile.date_of_birth) : null;
  const gender = profile?.biological_sex || 'diverse';

  return snacks.filter(s => {
    if (!s.is_active && s.is_active !== undefined) return false;
    if (age !== null) {
      const min = s.suitable_for_age_min ?? 16;
      const max = s.suitable_for_age_max ?? 99;
      if (age < min || age > max) return false;
    }
    if (s.suitable_for_gender && s.suitable_for_gender !== 'all') {
      // map: male/female/diverse
      if (s.suitable_for_gender === 'male' && gender === 'female') return false;
      if (s.suitable_for_gender === 'female' && gender === 'male') return false;
    }
    return true;
  });
}

function pickDailySnacks(snacks, count = 3) {
  if (snacks.length === 0) return [];
  // Seed by date so suggestions change daily but are consistent within a day
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((acc, v) => acc + parseInt(v), 0);
  const shuffled = [...snacks].sort((a, b) => {
    const ha = (a.id?.charCodeAt(0) || 0) + seed;
    const hb = (b.id?.charCodeAt(0) || 0) + seed;
    return ha - hb;
  });
  // Ensure variety: pick different types if possible
  const picked = [];
  const usedTypes = new Set();
  for (const s of shuffled) {
    if (picked.length >= count) break;
    if (!usedTypes.has(s.type)) {
      picked.push(s);
      usedTypes.add(s.type);
    }
  }
  // Fill up if needed
  for (const s of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked;
}

function SnackCard({ snack, isDoneToday, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const [feeling, setFeeling] = useState(null);
  const [logging, setLogging] = useState(false);
  const cfg = TYPE_CONFIG[snack.type] || TYPE_CONFIG.hiit;
  const colors = COLOR_CLASSES[snack.color_class || cfg.color] || COLOR_CLASSES.cyan;

  const handleDone = async () => {
    if (!feeling) return;
    setLogging(true);
    await onComplete(snack, feeling);
    setLogging(false);
    setExpanded(false);
    setFeeling(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border glass ${colors.border} overflow-hidden`}
    >
      <button
        onClick={() => !isDoneToday && setExpanded(!expanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start gap-4">
          <div className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${colors.bg}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{cfg.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                {HORMESIS_LABELS[snack.hormesis_type] || snack.hormesis_type}
              </span>
            </div>
            <h3 className="text-base font-black text-white leading-tight">{snack.name}</h3>
            {snack.subtitle && <p className="text-xs text-slate-400 mt-0.5">{snack.subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-bold text-white">{snack.duration_minutes} Min</span>
            </div>
            {isDoneToday ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''} text-slate-500`} />
            )}
          </div>
        </div>

        {snack.longevity_benefit && (
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">{snack.longevity_benefit}</p>
          </div>
        )}
      </button>

      <AnimatePresence>
        {expanded && !isDoneToday && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 pt-4">
              {snack.description && (
                <p className="text-sm text-slate-300 leading-relaxed">{snack.description}</p>
              )}

              {snack.instructions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Anleitung</p>
                  {snack.instructions.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {snack.rhonda_patrick_principle && (
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">🔬 Wissenschaft</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{snack.rhonda_patrick_principle}</p>
                </div>
              )}

              {/* Feeling Rating */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Wie war's?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      onClick={() => setFeeling(v)}
                      className={`text-xl transition-transform ${feeling >= v ? 'scale-110' : 'opacity-30'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleDone}
                disabled={!feeling || logging}
                className={`w-full h-12 rounded-xl font-black text-sm transition-all ${
                  feeling
                    ? `${colors.bg} ${colors.text} border ${colors.border} hover:opacity-90`
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {logging ? '...' : '✓ Snack absolviert!'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isDoneToday && (
        <div className="px-5 pb-4">
          <p className="text-xs text-emerald-400 font-bold">✓ Heute erledigt</p>
        </div>
      )}
    </motion.div>
  );
}

export default function FitnessSnacks() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: snacks = [] } = useQuery({
    queryKey: ['fitnessSnacks'],
    queryFn: () => base44.entities.FitnessSnack.list(),
  });

  const { data: profile } = useQuery({
    queryKey: ['neuroProfile', user?.email],
    queryFn: () => base44.entities.UserNeuroProfile.filter({ user_email: user.email }).then(r => r[0] || null),
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

  const filtered = filterSnacksForUser(snacks, profile);
  const daily = pickDailySnacks(filtered, 3);
  const doneTodayIds = new Set(todayLogs.map(l => l.snack_id));

  const streakDays = (() => {
    if (allLogs.length === 0) return 0;
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

  const handleComplete = async (snack, feeling) => {
    if (!user?.email) return;
    await base44.entities.FitnessSnackLog.create({
      user_email: user.email,
      snack_id: snack.id,
      snack_name: snack.name,
      snack_type: snack.type,
      hormesis_type: snack.hormesis_type,
      duration_minutes: snack.duration_minutes,
      completed_date: today,
      feeling_after: feeling,
    });
    queryClient.invalidateQueries({ queryKey: ['snackLogs'] });
    queryClient.invalidateQueries({ queryKey: ['snackLogsAll'] });
    base44.analytics.track({ eventName: 'fitness_snack_completed', properties: { snack_type: snack.type, duration: snack.duration_minutes } });
  };

  const age = profile ? getAgeFromBirthdate(profile.date_of_birth) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400 mb-1">neurometa</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Fitness Snacks</h1>
          <p className="text-sm text-slate-400 mt-1">Kurze Hormesis-Reize für Longevity & Vitalität</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl border border-orange-500/20 p-3 text-center">
            <p className="text-2xl font-black text-orange-400">{streakDays}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Streak Tage</p>
          </div>
          <div className="glass rounded-2xl border border-cyan-500/20 p-3 text-center">
            <p className="text-2xl font-black text-cyan-400">{allLogs.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Snacks</p>
          </div>
          <div className="glass rounded-2xl border border-emerald-500/20 p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{doneTodayIds.size}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Heute</p>
          </div>
        </div>

        {/* Personalization badge */}
        {(age || profile?.biological_sex) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-slate-400">
              🎯 Personalisiert für
              {age ? ` ${age} Jahre` : ''}
              {profile?.biological_sex === 'male' ? ', männlich' : profile?.biological_sex === 'female' ? ', weiblich' : ''}
            </span>
          </div>
        )}

        {/* Daily Snacks */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Deine heutigen Snacks</p>
          {daily.length === 0 ? (
            <div className="glass rounded-2xl border border-slate-700/50 p-8 text-center">
              <p className="text-slate-400 text-sm">Noch keine Fitness Snacks verfügbar.</p>
              <p className="text-slate-500 text-xs mt-1">Admin kann Snacks im AdminHub hinzufügen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daily.map(snack => (
                <SnackCard
                  key={snack.id}
                  snack={snack}
                  isDoneToday={doneTodayIds.has(snack.id)}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Science Note */}
        <div className="glass rounded-2xl border border-slate-700/30 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">🔬 Warum Hormesis?</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kurze, kontrollierte Stressreize – ob durch Kälte, Hitze, Hypoxie oder intensive Bewegung – aktivieren zelluläre Schutzprogramme (NRF2, AMPK, FOXO3). Das Ergebnis: mehr Mitochondrien, bessere VO2max, verlangsamtes Zellaltern. <span className="text-slate-300 font-medium">Dr. Rhonda Patrick nennt das „Conditioning the body for resilience."</span>
          </p>
        </div>

      </div>
    </div>
  );
}