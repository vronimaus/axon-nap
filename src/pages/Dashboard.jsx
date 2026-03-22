import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Activity, Target, Zap, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SlingSpiderChart from '../components/dashboard/SlingSpiderChart';
import OnboardingModal from '../components/dashboard/OnboardingModal';
import SessionDecision from '../components/dashboard/SessionDecision';
import ProgressSyncView from '../components/dashboard/ProgressSyncView';
import DailyReadinessCheck from '../components/dashboard/DailyReadinessCheck';
import { Helmet } from 'react-helmet-async';

import { useTrialStatus } from '../components/useTrialStatus';

export default function Dashboard() {
  const [mode, setMode] = useState(null); // 'rehab', 'performance', or null for selection
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const pullContainerRef = useRef(null);
  const queryClient = useQueryClient();
  
  const { user, isLoading, hasAccess } = useTrialStatus();

  useEffect(() => {
    if (isLoading || !user) return;
    
    if (!hasAccess) {
      window.location.href = createPageUrl('Landing');
      return;
    }

    // Check if readiness done today
    const today = new Date().toISOString().split('T')[0];
    const checkDone = sessionStorage.getItem('readiness_check_done');
    if (checkDone !== today && user.last_readiness_check !== today) {
      setShowReadinessCheck(true);
    }
  }, [user, isLoading, hasAccess]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('axon_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleReadinessClose = () => {
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('readiness_check_done', today);
    setShowReadinessCheck(false);
  };

  const handleTouchStart = (e) => {
    // Only start pull if at top of page
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullY(Math.min(delta * 0.4, 70));
    } else if (delta <= 0) {
      isPulling.current = false;
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    isPulling.current = false;
    if (pullY > 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(0);
      await queryClient.invalidateQueries();
      setTimeout(() => setIsRefreshing(false), 800);
    } else {
      setPullY(0);
    }
  };
  
  const { data: sessions = [] } = useQuery({
    queryKey: ['diagnosisSessions'],
    queryFn: () => base44.entities.DiagnosisSession.list('-created_date', 5),
    enabled: !!user
  });

   const { data: sessionDecision, isLoading: sessionLoading, isError: sessionError } = useQuery({
    queryKey: ['sessionDecision', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      try {
        const res = await base44.functions.invoke('sessionGenerator', {});
        return res.data;
      } catch (err) {
        console.error('Session Generator error:', err);
        return null;
      }
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 2000,
  });

  const { data: dashboardData = {} } = useQuery({
     queryKey: ['dashboardData', user?.email],
     queryFn: async () => {
       if (!user?.email) return {};
       const response = await base44.functions.invoke('dashboardDataAggregator', { daysBack: 30 });
       return response?.data || {};
     },
     enabled: !!user?.email,
     refetchInterval: 60000
   });



  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Ambient Glow Colors
  const getGlowColor = () => {
    if (!sessionDecision) return 'rgba(15, 23, 42, 0)'; // transparent
    if (sessionDecision.decision === 'training') return 'rgba(6, 182, 212, 0.15)'; // cyan
    if (sessionDecision.decision === 'rest') return 'rgba(148, 163, 184, 0.15)'; // slate
    return 'rgba(16, 185, 129, 0.15)'; // emerald
  };

  const glowColor = getGlowColor();

  // Mode Selection Screen (3 Fronten)
  if (!mode) {
    return (
      <motion.div 
        animate={{ boxShadow: `inset 0 0 120px ${glowColor}` }}
        transition={{ repeat: Infinity, duration: 4, repeatType: "reverse", ease: "easeInOut" }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 pb-20 md:pb-4 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: pullY > 0 ? 'none' : 'auto' }}
      >
        {/* Daily Readiness Check & Onboarding Modals — also shown on selection screen */}
        <AnimatePresence>
          {showReadinessCheck && user && (
            <DailyReadinessCheck user={user} onClose={handleReadinessClose} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
        </AnimatePresence>
        {/* Pull-to-Refresh Indicator */}
        {pullY > 0 && (
          <div className="fixed top-16 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${isRefreshing ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800/80 text-slate-400'}`} style={{ transform: `translateY(${pullY - 20}px)` }}>
              <motion.div animate={{ rotate: isRefreshing ? 360 : pullY * 5 }} transition={isRefreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}>↻</motion.div>
              {isRefreshing ? 'Aktualisiert…' : pullY > 50 ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
            </div>
          </div>
        )}
        {/* Kinetic Wave Background */}
        {sessionDecision && (
          <motion.div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)`
            }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: sessionDecision.decision === 'training' ? 3 : 6, 
              ease: "easeInOut" 
            }}
          />
        )}
        <Helmet>
          <title>Command - AXON Dashboard</title>
          <meta name="description" content="Dein persönliches AXON Command Center. Wähle zwischen Performance-Training, Rehabilitation oder Flow-Routinen." />
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:title" content="AXON Command Center" />
          <meta property="og:description" content="Dein persönliches Training Dashboard" />
          <meta property="og:type" content="website" />
        </Helmet>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full"
        >
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              {(() => {
                const h = new Date().getHours();
                const greeting = h < 12 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
                const firstName = user?.full_name?.split(' ')[0];
                return firstName ? `${greeting}, ${firstName}` : `${greeting}`;
              })()}
            </h1>
            <p className="text-base sm:text-lg text-slate-300">
              Drei Wege zu deinem optimalen Körper
            </p>
          </div>

          {/* Session Decision — AXON Triage */}
          <div className="mb-10 relative z-10">
            <AnimatePresence mode="wait">
              {showProgress ? (
                <ProgressSyncView 
                  key="progress"
                  dashboardData={dashboardData} 
                  sessionDecision={sessionDecision} 
                  onClose={() => setShowProgress(false)} 
                />
              ) : (
                <motion.div key="decision" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                  <SessionDecision user={user} data={sessionDecision} isLoading={sessionLoading} isError={sessionError} onClick={() => setShowProgress(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. PERFORMANCE (Goals) - NOW FIRST */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('performance')}
              className="glass rounded-xl sm:rounded-2xl border border-blue-500/30 p-6 sm:p-8 hover:border-blue-500/60 active:border-blue-500/80 transition-all group touch-target relative"
            >
            
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2 sm:mb-3">GOALS</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                Schalte neue Fähigkeiten frei: Von ersten Klimmzügen bis zum Human Flag. Dein personalisierter Trainingsplan basiert auf deinen Baselines.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Progressive Trainingsplanung • Mobility + Kraft • Messbare Fortschritte • Skill-Progression
              </p>
            </motion.button>

            {/* 2. REHAB (Schmerz) - NOW SECOND */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = createPageUrl('DiagnosisChat')}
              className="glass rounded-xl sm:rounded-2xl border border-emerald-500/30 p-6 sm:p-8 hover:border-emerald-500/60 active:border-emerald-500/80 transition-all group touch-target"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all animate-pulse">
                <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-2 sm:mb-3">REHAB</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                Akuter Schmerz? AXON analysiert die Root Cause über Hardware-Tests und Neuro-Drills, dann gibt dir einen phasierten Reha-Plan.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Detective-Diagnose • Faszien-Release (MFR) • Neuro-Reset • Strukturierte Wiederherstellung
              </p>
            </motion.button>

            {/* 3. FLOW (Daily Maintenance) - UNCHANGED */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = createPageUrl('FlowRoutines')}
              className="glass rounded-xl sm:rounded-2xl border border-purple-500/30 p-6 sm:p-8 hover:border-purple-500/60 active:border-purple-500/80 transition-all group touch-target"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2 sm:mb-3">FLOW</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                Tägliche Pflegeroutinen für dein System: Faszien-Release, Neuro-Drills, Mobility-Flows und Atemarbeit in 5-30 Min Sessions.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                12 MFR-Nodes • Mobility-CARs • Neuro-Hygiene • Regeneration • Daily Maintenance
              </p>
            </motion.button>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass rounded-xl border border-slate-700 p-4 text-center"
          >
            <p className="text-sm text-slate-400">
              AXON deckt den kompletten Lebenszyklus ab: Probleme lösen → Ziele erreichen → System pflegen
            </p>
          </motion.div>

          {/* Admin-Tool Link */}
          {user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <button
                onClick={() => window.location.href = createPageUrl('AdminDiagnostics')}
                className="w-full glass rounded-xl border border-cyan-500/30 p-4 hover:border-cyan-500/60 transition-all group"
              >
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-semibold">Coach Diagnose-Tool</span>
                </div>
              </button>
            </motion.div>
          )}
        </motion.div>
        </motion.div>
        );
        }

        return (
        <motion.div 
        animate={{ boxShadow: `inset 0 0 120px ${glowColor}` }}
        transition={{ repeat: Infinity, duration: 4, repeatType: "reverse", ease: "easeInOut" }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden"
        >
        {/* Kinetic Wave Background */}
        {sessionDecision && (
        <motion.div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)`
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: sessionDecision.decision === 'training' ? 3 : 6, 
            ease: "easeInOut" 
          }}
        />
        )}
      <Helmet>
        <title>{mode === 'rehab' ? 'REHAB' : 'PERFORMANCE'} - AXON Command</title>
        <meta name="description" content={mode === 'rehab' ? 'Analysiere und löse deine Beschwerden mit AXON Rehabilitation' : 'Erreiche deine Performance-Ziele mit AXON Training'} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Readiness Check Modal */}
      <AnimatePresence>
        {showReadinessCheck && user && (
          <DailyReadinessCheck user={user} onClose={handleReadinessClose} />
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      </AnimatePresence>

      {/* Header with Mode Switch - only show when mode is selected */}
      {mode && (
        <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 truncate">
                  ⚡ AXON Command
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 sm:mt-1 hidden xs:block">
                  Hack Your Software. Free Your Hardware.
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden xs:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                  <Button
                    onClick={() => {
                      setMode('rehab');
                      setSelectedBodyRegion(null);
                    }}
                    variant={mode === 'rehab' ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs sm:text-sm ${
                      mode === 'rehab'
                        ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    REHAB
                  </Button>
                  <Button
                    onClick={() => {
                      setMode('performance');
                      setSelectedBodyRegion(null);
                    }}
                    variant={mode === 'performance' ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs sm:text-sm ${
                      mode === 'performance'
                        ? 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    PERFORMANCE
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOnboarding(true)}
                  className="text-slate-400 hover:text-cyan-400 w-8 h-8 sm:w-9 sm:h-9"
                >
                  <Info className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setMode(null);
                    setSelectedBodyRegion(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-400 hover:text-slate-200 px-2 sm:px-4 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="hidden xs:inline">Zurück</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Centered */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {mode === 'rehab' && (
                <div className="space-y-4">
                  {/* Mode Title */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-transparent border-l-4 border-emerald-500 px-6 py-3 rounded-r-xl">
                    <h1 className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">REHAB</h1>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="glass rounded-xl sm:rounded-2xl border border-emerald-500/30 p-4 sm:p-6 bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <h2 className="text-base sm:text-lg font-semibold text-emerald-400 mb-3">Schmerz präzise lokalisieren</h2>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                      <p className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold flex-shrink-0">1.</span>
                        <span><strong>Punkt setzen:</strong> Tippe auf eine exakte Stelle – oder <strong>zeichne eine Linie</strong> entlang des Schmerzes für komplexe Muster</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold flex-shrink-0">2.</span>
                        <span>Wähle deine spezifischen Symptome aus der Liste aus</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold flex-shrink-0">3.</span>
                        <span>Starte die Analyse – AXON erkennt die Root Cause deines Problems</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'performance' && (
                <div className="space-y-4">
                  {/* Sling Spider Chart - Live Balance Monitor */}
                  {dashboardData?.today_stats && (
                    <SlingSpiderChart 
                      anterior={dashboardData.today_stats.anterior_score || 0}
                      posterior={dashboardData.today_stats.posterior_score || 0}
                      lateral={dashboardData.today_stats.lateral_score || 0}
                      alerts={dashboardData.sling_alerts || []}
                    />
                  )}

                  {/* Mode Title */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-transparent border-l-4 border-blue-500 px-6 py-3 rounded-r-xl">
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 tracking-tight">PERFORMANCE</h1>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="glass rounded-xl sm:rounded-2xl border border-blue-500/30 p-4 sm:p-6 bg-gradient-to-r from-blue-500/10 to-transparent">
                    <h2 className="text-base sm:text-lg font-semibold text-blue-400 mb-3">Was möchtest du schaffen?</h2>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-300 mb-4">
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold flex-shrink-0">•</span>
                        <span><strong>Konkrete Übung:</strong> "10 Klimmzüge", "Pistol Squat", "Handstand 30 Sekunden"</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold flex-shrink-0">•</span>
                        <span><strong>Skill freischalten:</strong> "Front Lever", "Muscle-Up", "Human Flag"</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold flex-shrink-0">•</span>
                        <span><strong>Mobility-Ziel:</strong> "Middle Split", "Pancake Stretch", "Bridge"</span>
                      </p>
                    </div>
                    <input
                      type="text"
                      value={selectedBodyRegion || ''}
                      onChange={(e) => setSelectedBodyRegion(e.target.value)}
                      placeholder="Gib dein Ziel ein..."
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-sm sm:text-base"
                    />
                  </div>

                  {/* Start Button — always shown when goal is entered */}
                  {selectedBodyRegion?.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        disabled={isGeneratingPlan}
                        onClick={() => {
                          const goal = selectedBodyRegion.trim();
                          window.location.href = createPageUrl('Discovery') + `?goal=${encodeURIComponent(goal)}`;
                        }}
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm sm:text-base"
                      >
                        {isGeneratingPlan ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Plan wird erstellt…
                          </span>
                        ) : user?.baseline_completed ? (
                          'Trainingsplan erstellen →'
                        ) : (
                          'Weiter zur Baseline-Messung →'
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Diagnose Button - Rehab Mode */}
              {mode === 'rehab' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 sm:mt-6"
                >
                  <Button
                    onClick={() => window.location.href = createPageUrl('DiagnosisChat')}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm sm:text-base"
                  >
                    Zur Diagnose →
                  </Button>
                </motion.div>
              )}

            </motion.div>
          </div>

      {/* Mode Indicator Badge - Hidden on small mobile to avoid overlapping with bottom nav */}
      <AnimatePresence>
        {mode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="hidden sm:block fixed bottom-6 right-6 z-50"
          >
            <div
              className={`px-3 sm:px-4 py-2 rounded-full backdrop-blur-xl border font-mono text-xs font-bold ${
                mode === 'rehab'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  mode === 'rehab' ? 'bg-emerald-400' : 'bg-blue-400'
                }`} />
                <span className="whitespace-nowrap">{mode === 'rehab' ? 'STEP 1: REHAB' : 'STEP 2: PERFORMANCE'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
      );
      }