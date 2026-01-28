import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Activity, Target, Zap, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveBodyMap from '../components/dashboard/InteractiveBodyMap';
import HardwarePanel from '../components/dashboard/HardwarePanel';
import NeuroMatrix from '../components/dashboard/NeuroMatrix';
import OnboardingModal from '../components/dashboard/OnboardingModal';
import DemoPaywall from '../components/demo/DemoPaywall';

export default function Dashboard() {
  const [mode, setMode] = useState('rehab'); // 'rehab' or 'performance'
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const hasSeenOnboarding = localStorage.getItem('axon_onboarding_seen');
        if (!hasSeenOnboarding && currentUser?.has_paid) {
          setShowOnboarding(true);
        }
      } catch (e) {
        setUser(null);
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
    queryFn: () => base44.entities.DiagnosisSession.list('-created_date', 5)
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['performanceGoals'],
    queryFn: () => base44.entities.PerformanceGoal.list()
  });

  // Show paywall if user not paid (except admin)
  if (!isLoading && user && !user.has_paid && user.role !== 'admin') {
    return <DemoPaywall />;
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      </AnimatePresence>

      {/* Header with Mode Switch */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                ⚡ AXON Command Center
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Hack Your Software. Free Your Hardware.
              </p>
            </div>
            
            {/* Step Progress & Mode Switch */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Dein Weg:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${mode === 'rehab' ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-slate-700 text-slate-400'}`}>
                  1. Rehab
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${mode === 'performance' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-700 text-slate-400'}`}>
                  2. Performance
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOnboarding(true)}
                className="text-slate-400 hover:text-cyan-400"
              >
                <Info className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setMode('rehab')}
                variant={mode === 'rehab' ? 'default' : 'outline'}
                className={`gap-2 transition-all ${
                  mode === 'rehab'
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/50'
                    : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Target className="w-4 h-4" />
                🔴 REHAB
              </Button>
              <Button
                onClick={() => setMode('performance')}
                variant={mode === 'performance' ? 'default' : 'outline'}
                className={`gap-2 transition-all ${
                  mode === 'performance'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                    : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                <Zap className="w-4 h-4" />
                🔵 PERFORMANCE
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL - Hardware Data */}
          <div className="lg:col-span-3">
            <HardwarePanel mode={mode} />
          </div>

          {/* CENTER - Interactive Body Map */}
          <div className="lg:col-span-6">
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {mode === 'rehab' && (
                <div className="glass rounded-2xl border border-red-500/30 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-red-400 mb-2">Schritt 1: Schmerzbereich markieren</h2>
                  <p className="text-sm text-slate-400 mb-4">Klicke auf deinen Körper um die Schmerzregion zu markieren, dann starte die Analyse.</p>
                </div>
              )}
              <InteractiveBodyMap
                mode={mode}
                onRegionSelect={setSelectedBodyRegion}
                sessions={sessions}
              />
              {mode === 'rehab' && selectedBodyRegion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Button
                    onClick={() => window.location.href = createPageUrl(`DiagnosisWizard?region=${selectedBodyRegion}`)}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold"
                  >
                    Analysieren starten →
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* RIGHT PANEL - Neuro Matrix */}
          <div className="lg:col-span-3">
            <NeuroMatrix
              mode={mode}
              goals={goals}
              selectedRegion={selectedBodyRegion}
            />
          </div>
        </div>
      </div>

      {/* Mode Indicator Badge */}
      <AnimatePresence>
        {mode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              className={`px-4 py-2 rounded-full backdrop-blur-xl border font-mono text-xs font-bold ${
                mode === 'rehab'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  mode === 'rehab' ? 'bg-red-400' : 'bg-cyan-400'
                }`} />
                {mode === 'rehab' ? 'STEP 1: REHAB' : 'STEP 2: PERFORMANCE'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}