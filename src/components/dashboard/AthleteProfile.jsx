import React from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Moon, Activity, TrendingUp } from 'lucide-react';

export default function AthleteProfile({ profile, systemStatus }) {
  // HRV from profile or show placeholder
  const hrvScore = profile?.hrv_score || null;
  
  // Sleep quality to hours mapping
  const sleepHours = {
    poor: 5.5,
    medium: 7.5,
    good: 8.5
  };
  
  // Recovery score based on sleep and stress
  const recoveryScore = profile ? Math.round(
    ((sleepHours[profile.sleep_quality_avg] / 8.5) * 50) + 
    ((10 - profile.baseline_stress_level) / 10 * 50)
  ) : null;
  
  // Strength from profile or show placeholder
  const strengthScore = profile?.strength_score || null;

  const metrics = [
    {
      icon: Heart,
      value: hrvScore !== null ? `${hrvScore}` : '--',
      unit: 'ms',
      label: 'HRV Score',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400'
    },
    {
      icon: Moon,
      value: profile ? sleepHours[profile.sleep_quality_avg].toFixed(1) : '--',
      unit: 'h',
      label: 'Sleep',
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400'
    },
    {
      icon: Activity,
      value: recoveryScore !== null ? `${recoveryScore}` : '--',
      unit: '%',
      label: 'Recovery',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    },
    {
      icon: TrendingUp,
      value: strengthScore !== null ? `${strengthScore}` : '--',
      unit: '%',
      label: 'Strength',
      color: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-cyan-500/20 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
          <User className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Athlete Profile</h2>
          <p className="text-sm text-slate-400">Hardware Status</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-xl border ${metric.borderColor} bg-gradient-to-br ${metric.color} p-4`}
          >
            <metric.icon className={`w-5 h-5 ${metric.textColor} mb-2`} />
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${metric.textColor}`}>
                {metric.value}
              </span>
              <span className={`text-sm ${metric.textColor} opacity-70`}>
                {metric.unit}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{metric.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}