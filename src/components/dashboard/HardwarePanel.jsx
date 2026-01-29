import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Moon, TrendingUp, User } from 'lucide-react';

export default function HardwarePanel({ mode }) {
  // Mock data - würde in Produktion von API kommen
  const hardwareData = {
    hrv: 65,
    sleep: 7.5,
    recovery: 82,
    strength: 85
  };

  const metrics = [
    {
      icon: Heart,
      label: 'HRV Score',
      value: hardwareData.hrv,
      unit: 'ms',
      color: 'text-red-400',
      gradient: 'from-red-500/20 to-red-600/5'
    },
    {
      icon: Moon,
      label: 'Sleep',
      value: hardwareData.sleep,
      unit: 'h',
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 to-blue-600/5'
    },
    {
      icon: Activity,
      label: 'Recovery',
      value: hardwareData.recovery,
      unit: '%',
      color: 'text-green-400',
      gradient: 'from-green-500/20 to-green-600/5'
    },
    {
      icon: TrendingUp,
      label: 'Strength',
      value: hardwareData.strength,
      unit: '%',
      color: 'text-cyan-400',
      gradient: 'from-cyan-500/20 to-cyan-600/5'
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="glass rounded-xl sm:rounded-2xl border border-cyan-500/20 p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Athlete Profile</h3>
            <p className="text-xs text-slate-500">Hardware Status</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-xl p-3 bg-gradient-to-br ${metric.gradient} border border-slate-700/50`}
            >
              <metric.icon className={`w-4 h-4 ${metric.color} mb-2`} />
              <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                {metric.value}
                <span className="text-sm ml-1">{metric.unit}</span>
              </div>
              <div className="text-xs text-slate-400">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Training Log */}
      <div className="glass rounded-2xl border border-cyan-500/20 p-4">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Training Log</h3>
        <div className="space-y-2">
          {[
            { exercise: 'Squat', sets: 3, reps: 8, weight: 100 },
            { exercise: 'Deadlift', sets: 3, reps: 5, weight: 140 },
            { exercise: 'Bench Press', sets: 4, reps: 10, weight: 80 }
          ].map((entry, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-xs"
            >
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">{entry.exercise}</span>
                <span className="text-slate-500">
                  {entry.sets}×{entry.reps} @ {entry.weight}kg
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`rounded-xl p-3 border ${
        mode === 'rehab'
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-cyan-500/10 border-cyan-500/30'
      }`}>
        <div className="text-xs font-mono">
          <div className={`font-bold mb-1 ${
            mode === 'rehab' ? 'text-red-400' : 'text-cyan-400'
          }`}>
            SYSTEM STATUS
          </div>
          <div className="text-slate-400">
            {mode === 'rehab' 
              ? 'Focus: Pain Relief & Neural Safety'
              : 'Focus: Performance & Range Expansion'
            }
          </div>
        </div>
      </div>
    </div>
  );
}