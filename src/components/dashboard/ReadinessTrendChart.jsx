import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

/**
 * ReadinessTrendChart
 *
 * Visualizes the user's 3-dimensional readiness over the last 7 days.
 * Data structure (neurometa.io compatible):
 *   {
 *     date: "YYYY-MM-DD",          // ISO date
 *     feeling_hardware: 1-10,      // physical / body quality
 *     focus_software:   1-10,      // mental clarity / focus
 *     energy_battery:   1-10,      // energy level
 *     readiness_score:  number,    // composite score
 *     readiness_status: "green" | "yellow" | "red"
 *   }
 */

const DAYS = 7;

function getLast7Days() {
  const days = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const date = new Date(label);
  const dayLabel = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs space-y-1">
      <p className="text-zinc-500 font-bold uppercase tracking-wider mb-1">{dayLabel}</p>
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

export default function ReadinessTrendChart({ checks = [] }) {
  const chartData = useMemo(() => {
    const last7 = getLast7Days();
    // Group checks by date — take last entry per day
    const byDate = {};
    checks.forEach(c => {
      if (!c.check_date) return;
      const d = c.check_date.split('T')[0];
      byDate[d] = c;
    });

    return last7.map(date => ({
      date,
      dayShort: new Date(date).toLocaleDateString('de-DE', { weekday: 'short' }),
      feeling_hardware: byDate[date]?.feeling_hardware ?? null,
      focus_software:   byDate[date]?.focus_software   ?? null,
      energy_battery:   byDate[date]?.energy_battery   ?? null,
      readiness_score:  byDate[date]?.readiness_score  ?? null,
      readiness_status: byDate[date]?.readiness_status ?? null,
    }));
  }, [checks]);

  const hasAnyData = chartData.some(d => d.feeling_hardware !== null);

  if (!hasAnyData) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-xs text-zinc-700 text-center leading-relaxed">
          Noch keine Daten.<br />Führe deinen ersten Daily Check durch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Körper</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Fokus</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Energie</span>
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
            domain={[1, 10]}
            ticks={[1, 5, 10]}
            tick={{ fill: '#3f3f46', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="feeling_hardware"
            name="Körper"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="focus_software"
            name="Fokus"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: '#22d3ee', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="energy_battery"
            name="Energie"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ r: 3, fill: '#a78bfa', strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}