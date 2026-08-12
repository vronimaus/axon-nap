import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

/**
 * MobilityTrendChart
 *
 * Visualizes mobility quality across recent Tune-Up sessions.
 * Supports three time periods:
 *   - sessions: last 10 individual sessions
 *   - weeks:    last 8 weeks, averaged per week
 *   - months:   last 6 months, averaged per month
 *
 * Composite mobility score (0-10):
 *   rom_improvement (0-3) → /3 * 5 = 0-5
 *   movement_quality (1-3) → (val-1)/2 * 5 = 0-5
 *   total = 0-10 (higher = better mobility)
 */

const PERIODS = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'weeks',    label: 'Wochen' },
  { key: 'months',   label: 'Monate' },
];

function computeMobilityScore(feedback) {
  if (!feedback) return null;
  const { rom_improvement, movement_quality } = feedback;
  if (rom_improvement == null && movement_quality == null) return null;
  const rom = (rom_improvement ?? 0) / 3 * 5;
  const quality = ((movement_quality ?? 1) - 1) / 2 * 5;
  return Math.round((rom + quality) * 10) / 10;
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatWeekLabel(weekKey) {
  const w = weekKey.split('-W')[1];
  return `KW${w}`;
}

function formatMonthLabel(monthKey) {
  const [, m] = monthKey.split('-');
  const date = new Date(2000, Number(m) - 1, 1);
  return date.toLocaleDateString('de-DE', { month: 'short' });
}

function avgOrNull(values) {
  const valid = values.filter(v => v != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs space-y-1">
      <p className="text-zinc-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-zinc-400">{p.name}</span>
          <span className="text-white font-bold ml-auto pl-4">{p.value ?? '—'}/10</span>
        </div>
      ))}
    </div>
  );
};

export default function MobilityTrendChart({ sessions = [] }) {
  const [period, setPeriod] = useState('sessions');

  const chartData = useMemo(() => {
    const validSessions = sessions.filter(s => s.feedback && s.created_date);

    if (period === 'sessions') {
      return validSessions
        .map(s => {
          const date = (s.created_date || '').split('T')[0];
          return {
            date,
            dayShort: new Date(date).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }),
            mobility_score: computeMobilityScore(s.feedback),
            tension_level: s.feedback.tension_level != null ? s.feedback.tension_level : null,
          };
        })
        .reverse()
        .slice(-10);
    }

    // Aggregate by week or month
    const groupKey = period === 'weeks' ? getWeekKey : getMonthKey;
    const formatter = period === 'weeks' ? formatWeekLabel : formatMonthLabel;
    const limit = period === 'weeks' ? 8 : 6;
    const groups = {};

    validSessions.forEach(s => {
      const date = (s.created_date || '').split('T')[0];
      const key = groupKey(date);
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        mobility_score: computeMobilityScore(s.feedback),
        tension_level: s.feedback.tension_level,
      });
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([key, items]) => ({
        date: key,
        dayShort: formatter(key),
        mobility_score: avgOrNull(items.map(i => i.mobility_score)),
        tension_level: avgOrNull(items.map(i => i.tension_level)),
      }));
  }, [sessions, period]);

  const hasData = chartData.some(d => d.mobility_score !== null);

  if (!hasData) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-xs text-zinc-700 text-center leading-relaxed">
          Noch keine Session-Daten.<br />Schließe ein Tune-Up ab, um deinen Fortschritt zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Mobilität</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Spannung</span>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                period === p.key
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-700 hover:text-zinc-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="dayShort"
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            tick={{ fill: '#3f3f46', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mobility_score"
            name="Mobilität"
            stroke="#34d399"
            strokeWidth={2}
            dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="tension_level"
            name="Spannung"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}