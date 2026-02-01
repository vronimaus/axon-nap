import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

export default function PerformanceTestChoice() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleTestNow = () => {
    window.location.href = createPageUrl('PerformanceTest');
  };

  const handleTestLater = () => {
    // Mark that user chose to test later, redirect to Dashboard
    localStorage.setItem('test_later', 'true');
    window.location.href = createPageUrl('Dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Baseline Assessment
          </h1>
          <p className="text-slate-400 text-lg">
            Zeige uns deine aktuellen Fähigkeiten – das System passt sich an deine Stärken an
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Test Now */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-white rounded-2xl p-8 h-full flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-cyan-500/20 transition-all">
              <button
                onClick={handleTestNow}
                className="w-full h-full flex flex-col items-center text-center"
              >
                <Zap className="w-16 h-16 text-cyan-500 mb-6" />
                <h2 className="text-xl font-semibold text-slate-400 mb-4">Starte sofort mit deinem personalisierten Baseline Assessment. Dies dauert etwa 10-15 Minuten.</h2>
                <div className="w-full bg-cyan-100 rounded-lg p-4 text-sm text-cyan-600 font-medium mb-6 mt-auto flex items-center justify-center gap-2">
                  <span>⏱️</span>
                  <span>10-15 Minuten | Körperliche Aktivität erforderlich</span>
                </div>
                <div className="w-full px-4 py-3 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">
                  Test starten →
                </div>
              </button>
            </div>
          </motion.div>

          {/* Option 2: Test Later */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-white rounded-2xl p-8 h-full flex flex-col cursor-pointer hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
              <button
                onClick={handleTestLater}
                className="w-full h-full flex flex-col items-center text-center"
              >
                <Calendar className="w-16 h-16 text-purple-500 mb-6" />
                <h2 className="text-xl font-semibold text-slate-400 mb-4">Starte jetzt mit dem Training und absolviere den Test vor deinem ersten Workout.</h2>
                <div className="w-full bg-purple-100 rounded-lg p-4 text-sm text-purple-600 font-medium mb-6 mt-auto flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Jederzeit nachholbar | Finde dein Tempo</span>
                </div>
                <div className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors">
                  Zum Dashboard →
                </div>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-3">Was ist ein Baseline Assessment?</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>Misst deine aktuellen physischen Fähigkeiten (Kraft, Mobilität, Ausdauer)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>Das System sieht deine Stärken und Schwächen – und personalisiert sich</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>Nach dem Test vergleichst du deine Fortschritte mit der Baseline</span>
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-400">•</span>
              <span>Du kannst den Test später jederzeit wiederholen</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}