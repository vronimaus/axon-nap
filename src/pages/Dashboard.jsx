import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Activity, Target, Zap, Info, ArrowLeft, Loader2 } from 'lucide-react';
import CombinedReadinessAssessment from '../components/dashboard/CombinedReadinessAssessment';
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
  // Combined assessment state
  const [pendingDestination, setPendingDestination] = useState(null); // { label, action }
  const [showAssessment, setShowAssessment] = useState(false);
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

    // Don't auto-trigger readiness anymore — it's triggered by destination choice
  }, [user, isLoading, hasAccess]);

  // Called when user picks a destination card
  const handleDestinationClick = (label, action) => {
    const today = new Date().toISOString().split('T')[0];
    const checkDone = sessionStorage.getItem('readiness_check_done');
    if (checkDone === today) {
      // Already done today → go directly
      action();
    } else {
      setPendingDestination({ label, action });
      setShowAssessment(true);
    }
  };

  const handleAssessmentComplete = () => {
    setShowAssessment(false);
    if (pendingDestination) {
      pendingDestination.action();
      setPendingDestination(null);
    }
  };

  const handleAssessmentSkip = () => {
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('readiness_check_done', today);
    setShowAssessment(false);
    if (pendingDestination) {
      pendingDestination.action();
      setPendingDestination(null);
    }
  };

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
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 pb-28 md:pb-4 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: pullY > 0 ? 'none' : 'auto' }}
      >
        {/* Combined Assessment Modal */}
        <AnimatePresence>
          {showAssessment && user && pendingDestination && (
            <CombinedReadinessAssessment
              user={user}
              destinationLabel={pendingDestination.label}
              onComplete={handleAssessmentComplete}
              onSkip={handleAssessmentSkip}
            />
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. QUICK SESSIONS */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDestinationClick('Quick Sessions', () => window.location.href = createPageUrl('FitnessSnacks'))}
              className="glass rounded-xl sm:rounded-2xl border border-orange-500/30 p-5 sm:p-6 hover:border-orange-500/60 active:border-orange-500/80 transition-all group touch-target text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 mx-auto group-hover:shadow-lg group-hover:shadow-orange-500/50 transition-all">
                <span className="text-xl">⚡</span>
              </div>
              <h2 className="text-lg font-bold text-orange-400 mb-2 text-center">QUICK SESSIONS</h2>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed text-center">
                1–10 Min. hormetische Micro-Workouts. Täglich personalisiert nach deinem Status.
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['HIIT', 'Breathwork', 'Strength'].map(tag => (
                  <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">{tag}</span>
                ))}
              </div>
            </motion.button>

            {/* 3. REHAB */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDestinationClick('Rehab & Recovery', () => window.location.href = createPageUrl('DiagnosisChat'))}
              className="glass rounded-xl sm:rounded-2xl border border-emerald-500/30 p-5 sm:p-6 hover:border-emerald-500/60 active:border-emerald-500/80 transition-all group touch-target text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 mx-auto group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-emerald-400 mb-2 text-center">REHAB & RECOVERY</h2>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed text-center">
                Akuter Schmerz? AXON analysiert die Root Cause und erstellt deinen Reha-Plan.
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['Diagnose', 'MFR-Release', 'Neuro-Reset'].map(tag => (
                  <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{tag}</span>
                ))}
              </div>
            </motion.button>

            {/* 4. FLOW */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDestinationClick('Flow', () => window.location.href = createPageUrl('FlowRoutines'))}
              className="glass rounded-xl sm:rounded-2xl border border-purple-500/30 p-5 sm:p-6 hover:border-purple-500/60 active:border-purple-500/80 transition-all group touch-target text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 mx-auto group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-purple-400 mb-2 text-center">FLOW</h2>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed text-center">
                Tägliche Pflegeroutinen: Faszien, Neuro-Drills, Mobility & Atem in 5–30 Min.
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['MFR-Nodes', 'Mobility', 'Regeneration'].map(tag => (
                  <span key={tag} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">{tag}</span>
                ))}
              </div>
            </motion.button>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass rounded-xl border border-slate-700/60 p-4 text-center"
          >
            <p className="text-sm text-slate-300">
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
        className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col relative"
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 md:pb-6">
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