import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Zap, Activity, Wind, MapPin, ChevronRight, Dumbbell, Mountain, Flame, Heart } from 'lucide-react';

// Sport-specific quick-start profiles
const SPORT_PROFILES = {
  bjj:         { icon: Dumbbell, label: 'BJJ / Grappling', focus: 'Hüfte · Nacken · Grip', color: 'text-amber-400' },
  crossfit:    { icon: Flame,    label: 'CrossFit',        focus: 'Schulter · Sprunggelenk', color: 'text-red-400' },
  kraftsport:  { icon: Dumbbell, label: 'Kraftsport',      focus: 'Hüfte · LWS · Schulter', color: 'text-blue-400' },
  climbing:    { icon: Mountain, label: 'Climbing / Bouldern', focus: 'Unterarm · Finger · Schulter', color: 'text-emerald-400' },
  yoga:        { icon: Heart,    label: 'Yoga / Mobility',  focus: 'Hüfte · Brustwirbelsäule', color: 'text-purple-400' },
  laufen:      { icon: Activity, label: 'Laufen / Ausdauer', focus: 'Waden · Hüftbeuger · Füße', color: 'text-cyan-400' },
};

function detectSport(primarySport) {
  if (!primarySport) return null;
  const s = primarySport.toLowerCase();
  if (s.includes('bjj') || s.includes('grappl') || s.includes('judo')) return 'bjj';
  if (s.includes('crossfit') || s.includes('wod')) return 'crossfit';
  if (s.includes('climb') || s.includes('boulder') || s.includes('kletter')) return 'climbing';
  if (s.includes('yoga') || s.includes('mobility') || s.includes('pilates')) return 'yoga';
  if (s.includes('lauf') || s.includes('run') || s.includes('jog') || s.includes('ausdauer') || s.includes('cardio')) return 'laufen';
  if (s.includes('kraft') || s.includes('powerlift') || s.includes('gewich') || s.includes('strength')) return 'kraftsport';
  return null;
}

const RECOMMENDATIONS = {
  green: {
    label: 'Bereit',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    sessions: [
      { title: 'Performance-Session', desc: 'Volle Mobilität + Kraft-Integration', action: 'routine', route: '/FlowRoutines' },
      { title: 'Skill freischalten', desc: 'An deine Grenze gehen', action: 'goal', route: '/Dashboard' },
    ],
  },
  yellow: {
    label: 'Moderat',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    sessions: [
      { title: 'Mobility-Tune-Up', desc: 'Gezielte Faszien-Arbeit + Neuro-Drill', action: 'tuneup' },
      { title: 'Aktive Erholung', desc: 'Leichte Fluss-Routine', action: 'routine', route: '/FlowRoutines' },
    ],
  },
  red: {
    label: 'Erholen',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    sessions: [
      { title: 'Vagus-Reset', desc: 'Parasympathikus aktivieren, runterfahren', action: 'routine', route: '/FlowRoutines' },
      { title: 'Sanfte Mobilisation', desc: 'Nur MFR, kein Load', action: 'tuneup' },
    ],
  },
};

export default function ReadinessSessionSelector({ readiness, user, onOpenBodyMap, onStartTuneUp }) {
  const status = readiness?.readiness_status || 'yellow';
  const score = readiness?.readiness_score;
  const rec = RECOMMENDATIONS[status] || RECOMMENDATIONS.yellow;

  const { data: profile } = useQuery({
    queryKey: ['neuroProfile', user?.email],
    queryFn: () => base44.entities.UserNeuroProfile.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const sportKey = detectSport(profile?.primary_sport);
  const sportProfile = sportKey ? SPORT_PROFILES[sportKey] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light text-white tracking-tight mb-1">
          Dein Plan heute
        </h2>
        <p className="text-sm text-zinc-600">
          Score {score?.toFixed(1)}/10 · <span className={rec.color}>{rec.label}</span> — basierend auf deinem Readiness-Check.
        </p>
      </div>

      {/* Status-based session recommendations */}
      <div className="space-y-3 mb-5">
        {rec.sessions.map((session, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (session.action === 'tuneup') onStartTuneUp();
              else if (session.action === 'routine' || session.action === 'goal') {
                window.location.href = session.route;
              }
            }}
            className={`w-full text-left rounded-2xl border ${rec.border} ${rec.bg} p-4 hover:border-white/[0.15] transition-all flex items-center justify-between`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${rec.color} mb-0.5`}>{session.title}</p>
              <p className="text-xs text-zinc-500">{session.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0 ml-3" />
          </motion.button>
        ))}
      </div>

      {/* Sport-specific quick-start */}
      {sportProfile && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700 mb-2 text-center">
            Für deinen Sport
          </p>
          <button
            onClick={onOpenBodyMap}
            className="w-full text-left rounded-2xl border border-white/[0.06] bg-zinc-900/80 p-4 hover:border-white/[0.12] transition-all flex items-center gap-3"
          >
            <sportProfile.icon className={`w-5 h-5 ${sportProfile.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-300">{sportProfile.label}</p>
              <p className="text-xs text-zinc-600">Fokus: {sportProfile.focus}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Specific tension — body map (secondary option) */}
      <div className="border-t border-white/[0.06] pt-4">
        <button
          onClick={onOpenBodyMap}
          className="w-full text-left rounded-xl hover:bg-zinc-900/50 transition-all p-3 flex items-center gap-3 group"
        >
          <MapPin className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Spezifische Spannung lokalisieren</p>
            <p className="text-[10px] text-zinc-600">Körperkarte öffnen — gezieltes Tune-Up</p>
          </div>
          <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
        </button>
      </div>
    </motion.div>
  );
}