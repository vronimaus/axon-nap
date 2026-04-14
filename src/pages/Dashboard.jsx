import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Activity, Target, Zap, Info, ArrowLeft, Loader2, RotateCw } from 'lucide-react';
import CombinedReadinessAssessment from '../components/dashboard/CombinedReadinessAssessment';
import CommandCenter from '../components/dashboard/CommandCenter';
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

  // Check if readiness already done today (from DB)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayReadinessDb } = useQuery({
    queryKey: ['readinessToday', user?.email, today],
    queryFn: async () => {
      const res = await base44.entities.ReadinessCheck.filter({ user_email: user.email, check_date: today });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  // Sync DB result to sessionStorage so handleDestinationClick works correctly
  useEffect(() => {
    if (todayReadinessDb) {
      sessionStorage.setItem('readiness_check_done', today);
    }
  }, [todayReadinessDb, today]);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!hasAccess) {
      window.location.href = createPageUrl('Landing');
    }
  }, [user, isLoading, hasAccess]);

  // Called when user picks a destination card
  const handleDestinationClick = (label, action) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkDone = sessionStorage.getItem('readiness_check_done');
    // Skip assessment if: sessionStorage set OR DB already has today's check
    if (checkDone === todayStr || todayReadinessDb) {
      action();
      return;
    }
    setPendingDestination({ label, action });
    setShowAssessment(true);
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
    return <div className="min-h-screen bg-[#111111]" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-[#111111]" />;
  }

  // Ambient Glow Colors
  const getGlowColor = () => {
    if (!sessionDecision) return 'rgba(15, 23, 42, 0)'; // transparent
    if (sessionDecision.decision === 'training') return 'rgba(6, 182, 212, 0.15)'; // cyan
    if (sessionDecision.decision === 'rest') return 'rgba(148, 163, 184, 0.15)'; // slate
    return 'rgba(16, 185, 129, 0.15)'; // emerald
  };

  const glowColor = getGlowColor();

  // Command Center (default view)
  if (!mode) {
    return (
      <motion.div
        className="min-h-screen bg-[#111111] relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: pullY > 0 ? 'none' : 'auto' }}
      >
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

        {/* Pull-to-Refresh Indicator */}
        {pullY > 0 && (
          <div className="fixed top-16 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all bg-zinc-800/80 text-zinc-400" style={{ transform: `translateY(${pullY - 20}px)` }}>
              <motion.div animate={{ rotate: isRefreshing ? 360 : pullY * 5 }} transition={isRefreshing ? { repeat: Infinity, duration: 0.6, ease: 'linear' } : {}}><RotateCw className="w-3.5 h-3.5" /></motion.div>
              {isRefreshing ? 'Aktualisiert…' : pullY > 50 ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
            </div>
          </div>
        )}

        <CommandCenter
          user={user}
          sessionDecision={sessionDecision}
          sessionLoading={sessionLoading}
          handleDestinationClick={handleDestinationClick}
        />
      </motion.div>
    );
  }

        return (
        <motion.div 
        animate={{ boxShadow: `inset 0 0 120px ${glowColor}` }}
        transition={{ repeat: Infinity, duration: 4, repeatType: "reverse", ease: "easeInOut" }}
        className="min-h-screen bg-[#111111] flex flex-col relative"
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
        <div className="sticky top-0 z-40 bg-[#111111] border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
                  AXON Command
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
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-500 hover:text-zinc-200'
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
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-500 hover:text-zinc-200'
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
                  <div className="border-l-4 border-zinc-600 px-6 py-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">REHAB</h1>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] p-4 sm:p-6 bg-zinc-900/80">
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-200 mb-3">Schmerz präzise lokalisieren</h2>
                    <div className="space-y-2 text-xs sm:text-sm text-zinc-400">
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-400 font-bold flex-shrink-0">1.</span>
                        <span><strong>Punkt setzen:</strong> Tippe auf eine exakte Stelle – oder <strong>zeichne eine Linie</strong> entlang des Schmerzes für komplexe Muster</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-400 font-bold flex-shrink-0">2.</span>
                        <span>Wähle deine spezifischen Symptome aus der Liste aus</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-400 font-bold flex-shrink-0">3.</span>
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
                  <div className="border-l-4 border-zinc-600 px-6 py-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">PERFORMANCE</h1>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] p-4 sm:p-6 bg-zinc-900/80">
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-200 mb-3">Was möchtest du schaffen?</h2>
                    <div className="space-y-2 text-xs sm:text-sm text-zinc-400 mb-4">
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-500 font-bold flex-shrink-0">—</span>
                        <span><strong>Konkrete Übung:</strong> "10 Klimmzüge", "Pistol Squat", "Handstand 30 Sekunden"</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-500 font-bold flex-shrink-0">—</span>
                        <span><strong>Skill freischalten:</strong> "Front Lever", "Muscle-Up", "Human Flag"</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-zinc-500 font-bold flex-shrink-0">—</span>
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
                        className="w-full h-12 sm:h-14 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] text-white font-bold text-sm sm:text-base"
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
                    className="w-full h-12 sm:h-14 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] text-white font-bold text-sm sm:text-base"
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
              className="px-3 sm:px-4 py-2 rounded-full backdrop-blur-xl border border-white/[0.08] bg-zinc-900/80 font-mono text-xs font-bold text-zinc-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse bg-zinc-500" />
                <span className="whitespace-nowrap">{mode === 'rehab' ? 'STEP 1: REHAB' : 'STEP 2: PERFORMANCE'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
      );
      }