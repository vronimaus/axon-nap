import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Play, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

export default function FlowRoutines() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => base44.entities.Routine.list(),
    enabled: !!user
  });

  const { data: completionHistory = [] } = useQuery({
    queryKey: ['routineHistory', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.RoutineHistory.filter({ created_by: user.email }, '-created_date', 20);
    },
    enabled: !!user?.email
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                🌊 FLOW - Deine Routinen
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Tägliche Trainingspläne für optimale Bewegungsintegration
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-cyan-500/30 p-6 bg-gradient-to-r from-cyan-500/10 to-transparent mb-8"
        >
          <h2 className="text-lg font-bold text-cyan-400 mb-2">Was ist FLOW?</h2>
          <p className="text-slate-300 text-sm">
            Kurze, strukturierte Trainings-Routinen, um dein neurologisches System täglich zu warten. 
            Von der schnellen 5-Minuten-Reset bis zur vollständigen 20-Minuten-Session.
          </p>
        </motion.div>

        {/* Routines Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {routines.length > 0 ? (
            routines.map((routine, idx) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl border border-cyan-500/30 p-6 hover:border-cyan-500/60 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{routine.icon || '🌊'}</div>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                    {routine.difficulty || 'medium'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{routine.routine_name}</h3>
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">{routine.description}</p>

                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>{routine.total_duration} Min</span>
                </div>

                <Button
                  onClick={() => window.location.href = createPageUrl(`Flow?routine=${routine.id}`)}
                  className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 group-hover:bg-cyan-500/40 transition-all"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Starten
                </Button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full glass rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-400">Keine Routinen verfügbar. Bald mehr!</p>
            </div>
          )}
        </div>

        {/* Recent Completions */}
        {completionHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-slate-700 p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Deine letzten Sessions</h3>
            <div className="space-y-3">
              {completionHistory.slice(0, 5).map((session, idx) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-semibold text-white">{session.routine_name}</p>
                      <p className="text-xs text-slate-400">{new Date(session.created_date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-400">{session.duration_actual || '—'} Min</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}