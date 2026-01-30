import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Lock, CheckCircle, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NeuroMatrix({ mode, goals, selectedRegion, user }) {
  // Load real data
  const { data: lastSession } = useQuery({
    queryKey: ['diagnosisSessions', 'rehab'],
    queryFn: async () => {
      const sessions = await base44.entities.DiagnosisSession.filter({}, '-created_date', 1);
      return sessions[0] || null;
    }
  });

  const { data: routineHistory = [] } = useQuery({
    queryKey: ['routineHistory'],
    queryFn: () => base44.entities.RoutineHistory.filter({ completed: true }, '-created_date', 20)
  });

  const { data: lastReadiness } = useQuery({
    queryKey: ['readinessCheck'],
    queryFn: async () => {
      const checks = await base44.entities.ReadinessCheck.filter({}, '-created_date', 1);
      return checks[0] || null;
    }
  });

  const { data: allChains = [] } = useQuery({
    queryKey: ['fascialChains'],
    queryFn: () => base44.entities.FascialChain.list()
  });

  // Berechne Stats aus echten Daten
  const getRehabStats = () => {
    const activePainCount = lastSession?.tested_chains?.length || 0;
    
    const completedRoutines = routineHistory.filter(r => r.completed).length;
    const painReduction = completedRoutines > 0 ? Math.min(completedRoutines * 15, 100) : 0;
    
    const recoveryScore = lastReadiness?.readiness_score 
      ? Math.round((lastReadiness.readiness_score / 10) * 100)
      : 0;
    
    return {
      activePain: activePainCount,
      painReduction: Math.round(painReduction),
      recoveryScore
    };
  };

  const rehabData = getRehabStats();

  // Fetch real progress data for the user
  const { data: userProgress = [] } = useQuery({
    queryKey: ['userPerformanceProgress', user?.email],
    queryFn: () => base44.entities.UserPerformanceProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const progressData = goals.reduce((acc, goal) => {
    const userGoalProgress = userProgress.find(p => p.goal_code === goal.code);
    acc[goal.code] = {
      total_sessions: userGoalProgress?.total_sessions || 0,
      unlocked: userGoalProgress?.unlocked || false
    };
    return acc;
  }, {});

  const getProgressColor = (totalSessions) => {
    if (totalSessions === 0) return 'text-slate-600';
    if (totalSessions <= 2) return 'text-cyan-400';
    if (totalSessions <= 4) return 'text-purple-400';
    return 'text-green-400';
  };

  const getProgressRing = (totalSessions) => {
    // Cap visual progress at 5 sessions for the ring
    const cappedSessions = Math.min(totalSessions, 5);
    const percentage = (cappedSessions / 5) * 100;
    return percentage;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className={`glass rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
        mode === 'rehab' ? 'border-red-500/20' : 'border-purple-500/20'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            mode === 'rehab'
              ? 'bg-gradient-to-br from-red-500 to-pink-500'
              : 'bg-gradient-to-br from-purple-500 to-cyan-500'
          }`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {mode === 'rehab' ? 'Recovery Center' : 'Neuro Matrix'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'rehab' ? 'Pain Management' : 'Master-12 Progress'}
            </p>
          </div>
        </div>

        {/* Stats */}
        {mode === 'performance' ? (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-lg sm:text-xl font-bold text-cyan-400">
                {Object.values(progressData).filter(p => p.unlocked).length}
              </div>
              <div className="text-xs text-slate-400">Unlocked</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-xl font-bold text-purple-400">
                {Object.values(progressData).reduce((sum, p) => sum + p.total_sessions, 0)}
              </div>
              <div className="text-xs text-slate-400">Total Sessions</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-xl font-bold text-green-400">
                {Math.round((Object.values(progressData).reduce((sum, p) => sum + p.total_sessions, 0) / (12 * 5)) * 100)}%
              </div>
              <div className="text-xs text-slate-400">Complete</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-xl font-bold text-red-400">
                {rehabData.activePain}
              </div>
              <div className="text-xs text-slate-400">Active Pain</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-xl font-bold text-orange-400">
                {rehabData.painReduction}%
              </div>
              <div className="text-xs text-slate-400">Reduction</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50">
              <div className="text-xl font-bold text-green-400">
                {rehabData.recoveryScore}%
              </div>
              <div className="text-xs text-slate-400">Recovery</div>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Content based on Mode */}
      {mode === 'performance' ? (
        /* Master-12 Grid */
        <div className="glass rounded-xl sm:rounded-2xl border border-purple-500/20 p-3 sm:p-4">
          <h3 className="text-xs font-bold text-slate-400 mb-2 sm:mb-3 uppercase tracking-wider">
            Performance Goals
          </h3>
          <div className="space-y-2 max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar">
            {goals.slice(0, 12).map((goal, idx) => {
            const progress = progressData[goal.code] || { total_sessions: 0, unlocked: false };
            const percentage = getProgressRing(progress.total_sessions);
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={createPageUrl(`PerformanceChat?goal=${goal.name}`)}>
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
                            className={getProgressColor(progress.total_sessions)}
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
                          <span className={`text-xs font-mono ${getProgressColor(progress.total_sessions)}`}>
                            {progress.total_sessions} mal gemacht
                          </span>
                          {progress.total_sessions >= 5 && (
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
      ) : (
        /* Rehab Pain Areas */
        <div className="glass rounded-xl sm:rounded-2xl border border-red-500/20 p-3 sm:p-4">
          <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
            Active Pain Areas
          </h3>
          <div className="space-y-2">
            {lastSession?.tested_chains && lastSession.tested_chains.length > 0 ? (
              lastSession.tested_chains.map((chainCode, idx) => {
                const chain = allChains.find(c => c.code === chainCode);
                const hardwareResult = lastSession.hardware_results?.[chainCode];
                const status = hardwareResult ? 'active' : 'stable';
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-slate-800/30 border border-red-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-slate-200">
                        {chain?.name_de || chainCode}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                        status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {status === 'active' ? 'Positiv' : 'Clear'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {chain?.test_name}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Starte eine Diagnose um Pain Areas zu sehen</p>
            )}
          </div>
        </div>
      )}

      {/* Active Drills */}
      <div className={`glass rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
        mode === 'rehab' ? 'border-red-500/20' : 'border-purple-500/20'
      }`}>
        <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
          {mode === 'rehab' ? '⚡ Recommended Drills' : '⚡ Flash-Drills Active'}
        </h3>
        <div className="space-y-2">
          {mode === 'rehab' ? (
            lastSession?.recommendations && lastSession.recommendations.length > 0 ? (
              lastSession.recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg border bg-red-500/10 border-red-500/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <div className="flex-1">
                      <div className="text-red-300 font-medium">
                        {rec}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Keine Empfehlungen vorhanden</p>
            )
          ) : (
            [
              { drill: 'Zungen-Gaumen-Druck', target: 'Pistol Squat', active: true },
              { drill: 'VOR-Training', target: 'Handstand', active: true },
              { drill: 'Eye-Lead Rotation', target: 'Dragon Squat', active: false }
            ].map((drill, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-xs ${
                  drill.active ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-800/30 border-slate-700/30'
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}