import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '../components/ui/pagination-controls';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';
import { Helmet } from 'react-helmet-async';

export default function FlowRoutines() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState(null);
  const itemsPerPage = 12;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          window.location.href = createPageUrl('Landing');
          return;
        }
        setUser(currentUser);
        
        // Check if readiness check already done today (via sessionStorage)
        const today = new Date().toISOString().split('T')[0];
        const checkDone = sessionStorage.getItem('readiness_check_done');
        
        if (checkDone !== today) {
          const lastCheck = currentUser.last_readiness_check;
          if (lastCheck !== today) {
            setShowReadinessCheck(true);
          } else {
            setReadinessStatus(currentUser.current_readiness_status);
            sessionStorage.setItem('readiness_check_done', today);
          }
        } else {
          setReadinessStatus(currentUser.current_readiness_status);
        }
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

  // Reset to page 1 when level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel]);

  const handleReadinessCheckClose = async () => {
    setShowReadinessCheck(false);
    // Mark check as done for today
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('readiness_check_done', today);
    // Refresh user data to get updated readiness status
    try {
      const updatedUser = await base44.auth.me();
      setReadinessStatus(updatedUser.current_readiness_status);
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Sort all routines by name (01, 02, 03...)
  const sortedRoutines = [...routines].sort((a, b) => a.routine_name.localeCompare(b.routine_name));

  // Group routines by progression level
  const routinesByLevel = {
    1: sortedRoutines.filter(r => r.progression_level === 1),
    2: sortedRoutines.filter(r => r.progression_level === 2),
    3: sortedRoutines.filter(r => r.progression_level === 3)
  };

  const levelInfo = {
    1: { name: 'Foundation', description: 'Grundlagen für ein stabiles System', color: 'from-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
    2: { name: 'Development', description: 'Aufbau von Kraft und Kontrolle', color: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    3: { name: 'Mastery', description: 'Maximale Performance und Athletik', color: 'from-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' }
  };

  const levelRoutines = selectedLevel ? routinesByLevel[selectedLevel] : [];
  const totalRoutines = levelRoutines.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutines = levelRoutines.slice(startIndex, endIndex);

  // Filter routines based on readiness status
  const shouldDisableRoutine = (routine) => {
    if (!readinessStatus) return false;
    
    // Red status: disable high AND medium intensity routines
    if (readinessStatus === 'red' && (routine.intensity_level === 'high' || routine.intensity_level === 'medium')) {
      return true;
    }
    
    // Yellow status: disable high intensity routines
    if (readinessStatus === 'yellow' && routine.intensity_level === 'high') {
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-6">
      <Helmet>
        <title>Flow Routines - AXON Training</title>
        <meta name="description" content="Entdecke AXON Flow Routines: MFR, Neuro-Drills, Mobility-Flows und funktionelle Bewegungen für optimale Performance und Regeneration." />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="AXON Flow Routines" />
        <meta property="og:description" content="MFR, Neuro-Drills, Mobility-Flows für optimale Performance" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="AXON Flow Routines" />
        <meta name="twitter:description" content="MFR, Neuro-Drills, Mobility-Flows für optimale Performance" />
      </Helmet>

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && (
          <DailyReadinessCheck user={user} onClose={handleReadinessCheckClose} />
        )}
      </AnimatePresence>

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
        {/* Readiness Recommendation */}
        {readinessStatus && !selectedLevel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 glass rounded-xl p-6 border ${
              readinessStatus === 'green'
                ? 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent'
                : readinessStatus === 'yellow' 
                ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent'
                : 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              {readinessStatus === 'green' ? (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-green-400" />
              ) : (
                <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                  readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                }`} />
              )}
              <div>
                <h3 className={`font-bold mb-2 ${
                  readinessStatus === 'green' ? 'text-green-400' :
                  readinessStatus === 'yellow' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {readinessStatus === 'green' 
                    ? 'Perfekte Tagesform! 💪' 
                    : readinessStatus === 'yellow' 
                    ? 'Moderate Belastung empfohlen ⚡' 
                    : 'Fokus auf sanfte Routinen 🛑'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {readinessStatus === 'green'
                    ? 'Dein System ist bereit. Wähle jede Routine, die du möchtest.'
                    : readinessStatus === 'yellow'
                    ? 'Wähle heute moderate oder leichte Routinen. Intensive Flows sind ausgegraut zum Schutz deines Systems.'
                    : 'Intensive Routinen sind heute ausgegraut. Fokussiere dich auf Atemtechniken, sanfte Mobilität und MFR.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!selectedLevel ? (
            // Level Selection View
            <motion.div
              key="levels"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {[1, 2, 3].map((level, idx) => {
                const levelData = levelInfo[level];
                const routinesInLevel = routinesByLevel[level];

                if (routinesInLevel.length === 0) return null;

                return (
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-4"
                  >
                    {/* Level Header */}
                    <div className={`glass rounded-2xl border ${levelData.border} p-6 bg-gradient-to-r ${levelData.color} to-transparent`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className={`text-2xl font-bold ${levelData.text} mb-2`}>Level {level}: {levelData.name}</h2>
                          <p className="text-slate-300 text-sm">{levelData.description}</p>
                        </div>
                        <Button
                          onClick={() => setSelectedLevel(level)}
                          size="sm"
                          className="bg-slate-800/50 text-slate-200 hover:bg-slate-700/50"
                        >
                          Alle anzeigen
                        </Button>
                      </div>
                    </div>

                    {/* Preview of first 3 routines */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {routinesInLevel.slice(0, 3).map((routine) => {
                        const isDisabled = shouldDisableRoutine(routine);

                        return (
                          <motion.div
                            key={routine.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass rounded-xl border p-6 transition-all group flex flex-col h-full ${
                              isDisabled 
                                ? 'border-slate-800 opacity-50 cursor-not-allowed' 
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex-1 mb-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`text-base font-bold ${isDisabled ? 'text-slate-500' : 'text-white'}`}>
                                  {routine.routine_name}
                                </h3>
                              </div>
                              <p className={`text-sm line-clamp-3 ${isDisabled ? 'text-slate-600' : 'text-slate-400'}`}>
                                {routine.description}
                              </p>
                              {isDisabled && (
                                <p className="text-xs text-red-400 mt-2">
                                  🛑 Heute nicht empfohlen
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                              <div className={`flex items-center gap-2 text-sm ${isDisabled ? 'text-slate-600' : 'text-slate-400'}`}>
                                <Clock className="w-4 h-4" />
                                <span>{routine.total_duration} Min</span>
                              </div>
                              <Button
                                onClick={() => !isDisabled && (window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`))}
                                size="sm"
                                disabled={isDisabled}
                                className={`${isDisabled ? 'opacity-30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'}`}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {routinesInLevel.length > 3 && (
                      <div className="text-center">
                        <Button
                          onClick={() => setSelectedLevel(level)}
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                        >
                          +{routinesInLevel.length - 3} weitere Routinen anzeigen
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // Routines View (Full Level)
            <motion.div
              key="routines"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Level Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-2xl border ${levelInfo[selectedLevel].border} p-6 bg-gradient-to-r ${levelInfo[selectedLevel].color} to-transparent`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${levelInfo[selectedLevel].text} mb-2`}>
                      Level {selectedLevel}: {levelInfo[selectedLevel].name}
                    </h2>
                    <p className="text-slate-300 text-sm">{levelInfo[selectedLevel].description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedLevel(null)}
                    className="text-slate-400 hover:text-slate-200 flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>

              {/* Routines Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRoutines.length > 0 ? (
                  paginatedRoutines.map((routine, idx) => {
                    const isDisabled = shouldDisableRoutine(routine);

                    return (
                    <motion.div
                      key={routine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`glass rounded-xl border p-6 transition-all group flex flex-col h-full ${
                        isDisabled 
                          ? 'border-slate-800 opacity-50 cursor-not-allowed' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1 mb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`text-base font-bold ${isDisabled ? 'text-slate-500' : 'text-white'}`}>
                            {routine.routine_name}
                          </h3>
                        </div>
                        <p className={`text-sm line-clamp-3 ${isDisabled ? 'text-slate-600' : 'text-slate-400'}`}>
                          {routine.description}
                        </p>
                        {isDisabled && (
                          <p className="text-xs text-red-400 mt-2">
                            🛑 Heute nicht empfohlen - dein System braucht Schonung
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className={`flex items-center gap-2 text-sm ${isDisabled ? 'text-slate-600' : 'text-slate-400'}`}>
                          <Clock className="w-4 h-4" />
                          <span>{routine.total_duration} Min</span>
                        </div>
                        <Button
                          onClick={() => !isDisabled && (window.location.href = createPageUrl(`Flow?routine_id=${routine.id}`))}
                          size="sm"
                          disabled={isDisabled}
                          className={`${isDisabled ? 'opacity-30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'}`}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                    );
                  })
                ) : (
                  <div className="glass rounded-xl border border-slate-700 p-6 text-center col-span-full">
                    <p className="text-slate-400">Keine Routinen in diesem Level verfügbar.</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {levelRoutines.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={totalRoutines}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Completions - only show on level selection view */}
        {!selectedLevel && completionHistory.length > 0 && (
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