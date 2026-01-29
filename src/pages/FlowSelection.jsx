import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Activity, Clock, Zap, Moon, TrendingUp } from 'lucide-react';

export default function FlowSelection() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list()
  });

  const { data: history = [] } = useQuery({
    queryKey: ['routineHistory', user?.email],
    queryFn: () => base44.entities.RoutineHistory.filter({ created_by: user?.email }, '-created_date', 7),
    enabled: !!user?.email
  });

  // Calculate streak
  const streak = history.length > 0 ? Math.min(history.length, 7) : 0;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'wakeup': return <Zap className="w-6 h-6" />;
      case 'full_reset': return <Activity className="w-6 h-6" />;
      case 'evening': return <Moon className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'wakeup': return 'from-amber-500 to-orange-600';
      case 'full_reset': return 'from-cyan-500 to-blue-600';
      case 'evening': return 'from-purple-500 to-indigo-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              🌊 Daily Flow
            </h1>
          </div>
          <p className="text-slate-400">
            Neural Hygiene – Pflege dein System täglich
          </p>
        </motion.div>

        {/* Streak Card */}
        {user && streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <span className="text-3xl font-bold text-cyan-400">{streak}</span>
              <span className="text-slate-300">Tage Streak 🔥</span>
            </div>
            <p className="text-sm text-slate-500">
              Du bist auf einem guten Weg – weiter so!
            </p>
          </motion.div>
        )}

        {/* Routines Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {routines.map((routine, idx) => (
            <motion.div
              key={routine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass rounded-2xl border border-slate-700 p-6 hover:border-cyan-500/50 transition-all group h-full flex flex-col">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(routine.category)} flex items-center justify-center mb-4 group-hover:shadow-lg transition-all`}>
                  {getCategoryIcon(routine.category)}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {routine.icon} {routine.routine_name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {routine.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{routine.total_duration} Min</span>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-slate-800 text-slate-400">
                      {routine.difficulty === 'easy' ? '🟢 Easy' : 
                       routine.difficulty === 'medium' ? '🟡 Medium' : 
                       '🔴 Advanced'}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  Starten →
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass rounded-2xl border border-slate-700 p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3">Was ist Neural Hygiene?</h3>
          <p className="text-slate-400 leading-relaxed">
            Genau wie du deine Zähne putzt, braucht dein Nervensystem tägliche Pflege. 
            Die AXON Body Journey führt dich durch eine systematische Rundreise deiner 12 MFR-Nodes, 
            kombiniert mit gezielten Neuro-Drills und Integration. 
            So bleibst du schmerzfrei, beweglich und leistungsfähig – jeden Tag.
          </p>
        </motion.div>
      </div>
    </div>
  );
}