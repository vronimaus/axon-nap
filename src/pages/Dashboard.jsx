import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Activity, Target, Zap, Info, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveBodyMap from '../components/dashboard/InteractiveBodyMap';
import HardwarePanel from '../components/dashboard/HardwarePanel';
import NeuroMatrix from '../components/dashboard/NeuroMatrix';
import OnboardingModal from '../components/dashboard/OnboardingModal';

import AthleteProfile from '../components/dashboard/AthleteProfile';
import SystemStatus from '../components/dashboard/SystemStatus';
import HardwareAlerts from '../components/dashboard/HardwareAlerts';

export default function Dashboard() {
  const [mode, setMode] = useState(null); // 'rehab', 'performance', or null for selection
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
          // Keine Auth -> zur Landing
          window.location.href = createPageUrl('Landing');
          return;
        }

        // Check Zugriff (Zahlung oder aktiver Trial)
        const hasTrialStart = currentUser?.trial_start_date;
        const daysElapsed = hasTrialStart ? Math.floor((new Date() - new Date(currentUser.trial_start_date)) / (1000 * 60 * 60 * 24)) : null;
        const isTrialActive = daysElapsed !== null && daysElapsed < 7;

        if (!currentUser?.has_paid && !isTrialActive) {
          // Kein Zugriff -> zur Landing
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

  const handleCloseOnboarding = () => {
    localStorage.setItem('axon_onboarding_seen', 'true');
    setShowOnboarding(false);
  };
  
  const { data: sessions = [] } = useQuery({
    queryKey: ['diagnosisSessions'],
    queryFn: () => base44.entities.DiagnosisSession.list('-created_date', 5),
    enabled: !!user
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['performanceGoals'],
    queryFn: () => base44.entities.PerformanceGoal.list(),
    enabled: !!user
  });

  const { data: neuroProfile } = useQuery({
    queryKey: ['neuroProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: performanceBaselines = [] } = useQuery({
    queryKey: ['performanceBaselines', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const baselines = await base44.entities.PerformanceBaseline.filter({ user_email: user.email });
      return baselines;
    },
    enabled: !!user?.email
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Mode Selection Screen (3 Fronten)
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 pb-20 md:pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full"
        >
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Willkommen zu AXON
            </h1>
            <p className="text-base sm:text-lg text-slate-400">
              Drei Wege zu deinem optimalen Körper
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. PERFORMANCE (Goals) - NOW FIRST */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (performanceBaselines.length === 0) {
                  window.location.href = createPageUrl('PerformanceTestChoice');
                } else {
                  setMode('performance');
                }
              }}
              className="glass rounded-xl sm:rounded-2xl border border-amber-500/30 p-6 sm:p-8 hover:border-amber-500/60 active:border-amber-500/80 transition-all group touch-target relative"
            >
              {performanceBaselines.length === 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              )}
            
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-amber-500/50 transition-all">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-2 sm:mb-3">GOALS</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Schalte neue Fähigkeiten frei.
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                12 Meilensteine → Mobility + Kraft → Performance
              </p>
            </motion.button>

            {/* 2. REHAB (Schmerz) - NOW SECOND */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('rehab')}
              className="glass rounded-xl sm:rounded-2xl border border-red-500/30 p-6 sm:p-8 hover:border-red-500/60 active:border-red-500/80 transition-all group touch-target"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-red-500/50 transition-all animate-pulse">
                <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-2 sm:mb-3">REHAB</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Akuter Schmerz? Löse dein Problem jetzt.
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Detective-Diagnose → 20 Scenarios → MFR + Neuro-Reset
              </p>
            </motion.button>

            {/* 3. FLOW (Daily Maintenance) - UNCHANGED */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = createPageUrl('FlowSelection')}
              className="glass rounded-xl sm:rounded-2xl border border-cyan-500/30 p-6 sm:p-8 hover:border-cyan-500/60 active:border-cyan-500/80 transition-all group touch-target"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4 mx-auto group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
                <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-2 sm:mb-3">FLOW</h2>
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Pflege dein System täglich.
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Body Journey → Neural Hygiene → Erhaltung
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
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
                        ? 'bg-red-500/30 text-red-400 hover:bg-red-500/40'
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
                        ? 'bg-amber-500/30 text-amber-400 hover:bg-amber-500/40'
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

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* PRIMARY FOCUS - Instructions & Body Map (full width on mobile, center on desktop) */}
          <div className="lg:col-span-12 xl:col-span-9 xl:col-start-2">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {mode === 'rehab' && (
                <div className="space-y-4">
                  {/* Mode Title */}
                  <div className="bg-gradient-to-r from-red-500/20 to-transparent border-l-4 border-red-500 px-6 py-3 rounded-r-xl">
                    <h1 className="text-2xl sm:text-3xl font-bold text-red-400 tracking-tight">REHAB</h1>
                  </div>
                  
                  {/* Instructions Card */}
                  <div className="glass rounded-xl sm:rounded-2xl border border-red-500/30 p-4 sm:p-6 bg-gradient-to-r from-red-500/10 to-transparent">
                    <h2 className="text-base sm:text-lg font-semibold text-red-400 mb-3">Schmerz präzise lokalisieren</h2>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                      <p className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">1.</span>
                        <span><strong>Punkt setzen:</strong> Tippe auf eine exakte Stelle – oder <strong>zeichne eine Linie</strong> entlang des Schmerzes für komplexe Muster</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">2.</span>
                        <span>Wähle deine spezifischen Symptome aus der Liste aus</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-red-400 font-bold flex-shrink-0">3.</span>
                        <span>Starte die Analyse – AXON erkennt die Root Cause deines Problems</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'performance' && (
                <div className="space-y-4">
                  {/* Mode Title */}
                  <div className="bg-gradient-to-r from-amber-500/20 to-transparent border-l-4 border-amber-500 px-6 py-3 rounded-r-xl">
                    <h1 className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">PERFORMANCE</h1>
                  </div>
                  
                  {/* Performance Goal Input */}
                  <div className="glass rounded-xl sm:rounded-2xl border border-amber-500/30 p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 to-transparent">
                    <h2 className="text-base sm:text-lg font-semibold text-amber-400 mb-3">Nächstes Ziel:</h2>
                    <input
                      type="text"
                      value={selectedBodyRegion || ''}
                      onChange={(e) => setSelectedBodyRegion(e.target.value)}
                      placeholder="z.B. Klimmzug, Pistol Squat, Handstand..."
                      className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm sm:text-base"
                    />
                  </div>
                  
                  {/* Tension Question */}
                  {selectedBodyRegion && selectedBodyRegion.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="glass rounded-xl sm:rounded-2xl border border-purple-500/30 p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-transparent">
                        <h3 className="text-sm sm:text-base font-semibold text-purple-400 mb-2">
                          Spürst du Spannungen oder Einschränkungen?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300">
                          Für dein Ziel "<span className="text-amber-400 font-semibold">{selectedBodyRegion}</span>" kann es hilfreich sein, bestehende Spannungen zu kennen. Falls ja, markiere sie unten auf der BodyMap. Falls nicht, starte direkt.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const encodedGoal = encodeURIComponent(selectedBodyRegion.trim());
                          window.location.href = createPageUrl(`PerformanceChat?goal=${encodedGoal}`);
                        }}
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-sm sm:text-base"
                      >
                        Coaching starten →
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Body Map - ONLY in Rehab Mode */}
              {mode === 'rehab' && (
               <InteractiveBodyMap
                 mode={mode}
                 onRegionSelect={setSelectedBodyRegion}
                 sessions={sessions}
               />
              )}
              {mode === 'rehab' && selectedBodyRegion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 sm:mt-6"
                >
                  <Button
                    onClick={() => {
                      // Hole die Map-Daten aus sessionStorage
                      const mapData = sessionStorage.getItem('bodyMapData');
                      if (mapData) {
                        const data = JSON.parse(mapData);
                        // Navigiere zum Chat mit den Map-Daten als URL-Parameter
                        const params = new URLSearchParams({
                          mapData: JSON.stringify(data),
                          region: selectedBodyRegion
                        });
                        window.location.href = createPageUrl(`DiagnosisChat?${params.toString()}`);
                      } else {
                        // Fallback falls keine Map-Daten vorhanden
                        window.location.href = createPageUrl(`DiagnosisChat?region=${selectedBodyRegion}`);
                      }
                    }}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold text-sm sm:text-base"
                  >
                    Analysieren starten →
                  </Button>
                </motion.div>
              )}
              

            </motion.div>
          </div>

          {/* SECONDARY PANELS - Athlete Profile & Status (below on mobile, side panels on desktop) */}
          <div className="lg:col-span-6 xl:col-span-4 space-y-4">
            <AthleteProfile profile={neuroProfile} systemStatus={mode} />
            <HardwareAlerts profile={neuroProfile} />
          </div>

          <div className="lg:col-span-6 xl:col-span-4 space-y-4">
            <SystemStatus mode={mode} profile={neuroProfile} lastSession={sessions[0]} />
            <NeuroMatrix
              mode={mode}
              goals={goals}
              selectedRegion={selectedBodyRegion}
              user={user}
            />
          </div>
          </div>
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
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  mode === 'rehab' ? 'bg-red-400' : 'bg-cyan-400'
                }`} />
                <span className="whitespace-nowrap">{mode === 'rehab' ? 'STEP 1: REHAB' : 'STEP 2: PERFORMANCE'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}