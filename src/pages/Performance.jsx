import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy, Target } from 'lucide-react';
import GoalCard from '../components/performance/GoalCard';
import TriplePath from '../components/performance/TriplePath';
import { useDemoTimer } from '../components/demo/useDemoTimer';
import DemoPaywall from '../components/demo/DemoPaywall';

export default function Performance() {
  const { isDemoExpired } = useDemoTimer();
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['performanceGoals'],
    queryFn: () => base44.entities.PerformanceGoal.list()
  });

  // Check if goal is in URL params
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const goalCode = params.get('goal');
    if (goalCode && goals.length > 0) {
      const goal = goals.find(g => g.code === goalCode);
      if (goal) {
        setSelectedGoal(goal);
      }
    }
  }, [goals]);
  
  if (isDemoExpired) {
    return <DemoPaywall />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <AnimatePresence mode="wait">
          {!selectedGoal ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 neuro-glow"
                >
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 sm:mb-3 px-4">
                  Performance-Ziele
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto px-4">
                  Die 12 Master-Ziele für maximale Bewegungsqualität. Jedes Ziel folgt der Triple-Path-Logik: 
                  Mobilisation, Dehnung, Kräftigung & Neuro-Fix.
                </p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border border-cyan-500/20">
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1">{goals.length}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Master-Ziele</div>
                </div>
                <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border border-purple-500/20">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">4</div>
                  <div className="text-xs sm:text-sm text-slate-400">Schritte pro Ziel</div>
                </div>
              </div>
              
              {/* Goals Grid */}
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    onClick={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>
              
              {goals.length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Noch keine Performance-Ziele vorhanden.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="triple-path"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TriplePath
                goal={selectedGoal}
                onBack={() => setSelectedGoal(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}