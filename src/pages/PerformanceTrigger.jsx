import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import InteractiveBodyMap from '../components/dashboard/InteractiveBodyMap';

export default function PerformanceTrigger() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [step, setStep] = useState('goal'); // 'goal' or 'tension'
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          navigate(createPageUrl('Landing'));
          return;
        }
        setUser(currentUser);

        // Get goal from URL if coming from dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const urlGoal = urlParams.get('goal');
        if (urlGoal) {
          setGoal(urlGoal);
          setStep('tension');
        }
      } catch (error) {
        navigate(createPageUrl('Landing'));
      }
    };
    checkAuth();
  }, [navigate]);

  const handleContinueToTension = () => {
    if (!goal.trim()) {
      toast.error('Bitte gib dein Ziel ein');
      return;
    }
    setStep('tension');
  };

  const handleStartCoaching = () => {
    // Get bodymap data from sessionStorage
    const mapData = sessionStorage.getItem('bodyMapData');
    
    // Navigate to PerformanceChat with goal and optional map data
    const params = new URLSearchParams({ goal: goal.trim() });
    if (mapData) {
      params.append('mapData', mapData);
    }
    
    navigate(createPageUrl(`PerformanceChat?${params.toString()}`));
  };

  const handleSkipTension = () => {
    handleStartCoaching();
  };

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 'tension' ? setStep('goal') : navigate(createPageUrl('Dashboard'))}
              className="text-slate-400 hover:text-amber-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-amber-400">Performance Setup</h1>
              <p className="text-xs text-slate-500">
                {step === 'goal' ? 'Schritt 1: Ziel definieren' : 'Schritt 2: Spannungen markieren (optional)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {step === 'goal' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Goal Input */}
            <div className="glass rounded-2xl border border-amber-500/30 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Was ist dein nächstes Ziel?
              </h2>
              <p className="text-slate-400 mb-6 text-sm sm:text-base">
                Beschreibe, welchen athletischen Meilenstein du erreichen möchtest.
              </p>
              
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="z.B. Klimmzug, Pistol Squat, Handstand, Middle Split..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base sm:text-lg"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleContinueToTension();
                }}
              />

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleContinueToTension}
                  disabled={!goal.trim()}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-6 sm:px-8 py-3 text-base sm:text-lg h-auto"
                >
                  Weiter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="glass rounded-xl border border-slate-700 p-4 text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                Im nächsten Schritt kannst du optional Spannungsbereiche markieren, die dich bei diesem Ziel beeinträchtigen könnten.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tension Question */}
            <div className="glass rounded-2xl border border-amber-500/30 p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 to-transparent">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Spürst du Spannungen oder Einschränkungen?
              </h2>
              <p className="text-slate-300 mb-4 text-sm sm:text-base">
                Für dein Ziel "<span className="text-amber-400 font-semibold">{goal}</span>" ist es wichtig zu wissen, ob bestimmte Körperbereiche bereits eingeschränkt oder angespannt sind.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Falls ja, markiere sie unten auf der BodyMap. Falls nicht, überspringe diesen Schritt einfach.
              </p>
            </div>

            {/* BodyMap */}
            <InteractiveBodyMap
              mode="performance"
              onRegionSelect={() => {}}
              sessions={[]}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 sm:gap-4">
              <Button
                onClick={handleSkipTension}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-400 hover:text-slate-200 h-12 sm:h-14 text-sm sm:text-base"
              >
                Keine Spannungen
              </Button>
              <Button
                onClick={handleStartCoaching}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 h-12 sm:h-14 text-sm sm:text-base font-semibold"
              >
                Coaching starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}