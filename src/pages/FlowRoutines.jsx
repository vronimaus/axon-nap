import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Play, ArrowLeft, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

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

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Kategorisiere Routinen
  const categories = [
    {
      id: 'pain-relief',
      name: 'Akuten Schmerz lindern',
      description: 'Schnelle Hilfe bei akutem Schmerz - 5-15 Minuten',
      color: 'from-red-500/20 to-transparent border-red-500/30',
      textColor: 'text-red-400',
      icon: 'AlertCircle'
    },
    {
      id: 'mobility',
      name: 'Beweglichkeit verbessern',
      description: 'Flexibilität und Mobilität trainieren',
      color: 'from-amber-500/20 to-transparent border-amber-500/30',
      textColor: 'text-amber-400',
      icon: 'Zap'
    },
    {
      id: 'maintenance',
      name: 'Tägliche Prävention',
      description: 'Routine-Wartung für langfristige Gesundheit',
      color: 'from-cyan-500/20 to-transparent border-cyan-500/30',
      textColor: 'text-cyan-400',
      icon: 'Activity'
    },
    {
      id: 'strength',
      name: 'Kraft aufbauen',
      description: 'Performance-Training für spezifische Ziele',
      color: 'from-green-500/20 to-transparent border-green-500/30',
      textColor: 'text-green-400',
      icon: 'Zap'
    }
  ];

  const getRoutinesByCategory = (categoryId) => {
    if (categoryId === 'pain-relief') {
      return routines.filter(r => r.category === 'wakeup' || r.total_duration <= 15);
    }
    if (categoryId === 'mobility') {
      return routines.filter(r => r.total_duration <= 20);
    }
    if (categoryId === 'maintenance') {
      return routines.filter(r => r.category === 'evening' || r.total_duration <= 30);
    }
    if (categoryId === 'strength') {
      return routines.filter(r => r.total_duration >= 20);
    }
    return [];
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const routinesInCategory = selectedCategory ? getRoutinesByCategory(selectedCategory) : [];

  // Back to category selection
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">FLOW</h1>
                <p className="text-sm text-slate-400 mt-1">Wähle was du brauchst</p>
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
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-cyan-500/30 p-6 bg-gradient-to-r from-cyan-500/10 to-transparent mb-8"
          >
            <h2 className="text-lg font-bold text-cyan-400 mb-2">Was ist FLOW?</h2>
            <p className="text-slate-300 text-sm">
              Trainingsprogramme für dein Nervensystem. Kurz, einfach, wirkungsvoll. 
              Wähle aus, was du heute brauchst - und los geht's.
            </p>
          </motion.div>

          {/* Category Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((category, idx) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`glass rounded-xl border p-6 hover:border-opacity-100 transition-all text-left group ${category.color}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${category.textColor} mb-1`}>
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-400">{category.description}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${category.textColor} group-hover:translate-x-1 transition-transform flex-shrink-0`} />
                </div>

                {/* Count */}
                <div className="text-xs text-slate-500">
                  {getRoutinesByCategory(category.id).length} Routinen
                </div>
              </motion.button>
            ))}
          </div>

          {/* Recent Completions */}
          {completionHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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

  // Category view - show routines
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${selectedCategoryData?.textColor}`}>
                {selectedCategoryData?.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">{selectedCategoryData?.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCategory(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {routinesInCategory.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routinesInCategory.map((routine, idx) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all group flex flex-col"
              >
                {/* Content */}
                <div className="flex-1 mb-4">
                  <h3 className="text-base font-bold text-white mb-2">{routine.routine_name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{routine.description}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{routine.total_duration} Min</span>
                  </div>
                  <Button
                    onClick={() => window.location.href = createPageUrl(`Flow?routine=${routine.id}`)}
                    size="sm"
                    className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl border border-slate-700 p-12 text-center">
            <p className="text-slate-400">Keine Routinen in dieser Kategorie. Bald mehr!</p>
          </div>
        )}
      </div>
    </div>
  );
}