import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FlowRoutines() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  const categories = [
    {
      id: 'neuro-athletik',
      name: 'Neuro-Athletik',
      description: 'Gezielte Übungen für dein Nervensystem: Verbessere Augen, Gleichgewicht und Körperwahrnehmung für mehr Stabilität und schnelle Reaktionen.',
      color: { gradient: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', button: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' }
    },
    {
      id: 'mobility-training',
      name: 'Mobility-Training',
      description: 'Fördere deine Beweglichkeit in Gelenken und Muskeln. Löse Steifheit und erweitere deinen Bewegungsradius.',
      color: { gradient: 'from-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', button: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' }
    },
    {
      id: 'atemtechniken',
      name: 'Atemtechniken',
      description: 'Meistere die Kraft deines Atems. Ob für mehr Energie, zur Beruhigung oder zur Verbesserung deiner Ausdauer.',
      color: { gradient: 'from-green-500/20', border: 'border-green-500/30', text: 'text-green-400', button: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' }
    },
    {
      id: 'mfr',
      name: 'Myofasziale Release (MFR)',
      description: 'Löse Verspannungen im Fasziengewebe. Gezielter Druck hilft, Schmerzen zu lindern und die Geschmeidigkeit zu erhöhen.',
      color: { gradient: 'from-red-500/20', border: 'border-red-500/30', text: 'text-red-400', button: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' }
    },
    {
      id: 'funktionelles-training',
      name: 'Funktionelles Kraft- & Bewegungstraining',
      description: 'Baue alltagsrelevante Kraft auf und verbessere deine Bewegungseffizienz durch ganzheitliche Übungen.',
      color: { gradient: 'from-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', button: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' }
    }
  ];

  const getRoutinesForCategory = (categoryId) => {
    return routines.filter(routine => routine.category === categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">FLOW Routinen</h1>
              <p className="text-sm text-slate-400 mt-1">Wähle deine tägliche Dosis Bewegung und Fokus</p>
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
        {categories.map((category, catIdx) => (
          <div key={category.id} className="mb-12">
            {/* Category Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className={`glass rounded-2xl border ${category.color.border} p-6 bg-gradient-to-r ${category.color.gradient} to-transparent mb-8`}
            >
              <h2 className={`text-xl font-bold ${category.color.text} mb-2`}>{category.name}</h2>
              <p className="text-slate-300 text-sm">{category.description}</p>
            </motion.div>

            {/* Routines Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRoutinesForCategory(category.id).length > 0 ? (
                getRoutinesForCategory(category.id).map((routine, idx) => (
                  <motion.div
                    key={routine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (catIdx * 0.1) + (idx * 0.05) }}
                    className="glass rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all group flex flex-col h-full"
                  >
                    <div className="flex-1 mb-4">
                      <h3 className="text-base font-bold text-white mb-2">{routine.routine_name}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3">{routine.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{routine.total_duration} Min</span>
                      </div>
                      <Button
                        onClick={() => window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`)}
                        size="sm"
                        className={`${category.color.button}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass rounded-xl border border-slate-700 p-6 text-center col-span-full">
                  <p className="text-slate-400">Keine Routinen in dieser Kategorie. Mehr folgen bald!</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Recent Completions */}
        {completionHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl border border-slate-700 p-6 mt-12"
          >
            <h3 className="text-lg font-bold text-white mb-4">Deine letzten Sessions</h3>
            <div className="space-y-3">
              {completionHistory.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white text-sm">{session.routine_name}</p>
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