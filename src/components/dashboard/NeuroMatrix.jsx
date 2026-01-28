import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Lock, CheckCircle, Zap } from 'lucide-react';

export default function NeuroMatrix({ mode, goals, selectedRegion }) {
  // Mock progress data - würde von API kommen
  const progressData = {
    backbend: { level: 2, unlocked: true },
    middle_split: { level: 3, unlocked: true },
    pancake: { level: 1, unlocked: true },
    deep_squat: { level: 4, unlocked: true },
    front_split: { level: 2, unlocked: true },
    overhead: { level: 3, unlocked: true },
    pistol_squat: { level: 1, unlocked: false },
    dragon_squat: { level: 0, unlocked: false },
    handstand: { level: 2, unlocked: true },
    l_sit: { level: 1, unlocked: false },
    skin_the_cat: { level: 0, unlocked: false },
    jefferson_curl: { level: 3, unlocked: true }
  };

  const getProgressColor = (level) => {
    if (level === 0) return 'text-slate-600';
    if (level <= 2) return 'text-cyan-400';
    if (level <= 4) return 'text-purple-400';
    return 'text-green-400';
  };

  const getProgressRing = (level) => {
    const percentage = (level / 5) * 100;
    return percentage;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl border border-purple-500/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Neuro Matrix</h3>
            <p className="text-xs text-slate-500">Master-12 Progress</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <div className="text-xl font-bold text-cyan-400">
              {Object.values(progressData).filter(p => p.unlocked).length}
            </div>
            <div className="text-xs text-slate-400">Unlocked</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <div className="text-xl font-bold text-purple-400">
              {Object.values(progressData).reduce((sum, p) => sum + p.level, 0)}
            </div>
            <div className="text-xs text-slate-400">Total Lvl</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <div className="text-xl font-bold text-green-400">
              {Math.round((Object.values(progressData).reduce((sum, p) => sum + p.level, 0) / (12 * 5)) * 100)}%
            </div>
            <div className="text-xs text-slate-400">Complete</div>
          </div>
        </div>
      </div>

      {/* Master-12 Grid */}
      <div className="glass rounded-2xl border border-purple-500/20 p-4">
        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
          Performance Goals
        </h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
          {goals.slice(0, 12).map((goal, idx) => {
            const progress = progressData[goal.code] || { level: 0, unlocked: false };
            const percentage = getProgressRing(progress.level);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={createPageUrl('Performance')}>
                  <div className="group relative p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      {/* Progress Ring */}
                      <div className="relative">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-slate-700"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
                            className={getProgressColor(progress.level)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-lg">
                          {progress.unlocked ? goal.icon : <Lock className="w-4 h-4 text-slate-600" />}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                          {goal.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-mono ${getProgressColor(progress.level)}`}>
                            Level {progress.level}/5
                          </span>
                          {progress.level === 5 && (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Status Badge */}
                    {!progress.unlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-xs text-red-400 font-mono">
                          LOCKED
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active Drills */}
      <div className="glass rounded-2xl border border-purple-500/20 p-4">
        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
          Active Neuro Drills
        </h3>
        <div className="space-y-2">
          {[
            { drill: 'Zungen-Gaumen-Druck', target: 'Pistol Squat', active: true },
            { drill: 'VOR-Training', target: 'Handstand', active: true },
            { drill: 'Eye-Lead Rotation', target: 'Dragon Squat', active: false }
          ].map((drill, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-xs ${
                drill.active
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-slate-800/30 border-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  drill.active ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'
                }`} />
                <div className="flex-1">
                  <div className={drill.active ? 'text-purple-300 font-medium' : 'text-slate-400'}>
                    {drill.drill}
                  </div>
                  <div className="text-slate-500 text-xs">→ {drill.target}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}