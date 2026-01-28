import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveBodyMap from '../components/dashboard/InteractiveBodyMap';
import HardwarePanel from '../components/dashboard/HardwarePanel';
import NeuroMatrix from '../components/dashboard/NeuroMatrix';

export default function Dashboard() {
  const [mode, setMode] = useState('performance'); // 'rehab' or 'performance'
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(null);
  
  const { data: sessions = [] } = useQuery({
    queryKey: ['diagnosisSessions'],
    queryFn: () => base44.entities.DiagnosisSession.list('-created_date', 5)
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['performanceGoals'],
    queryFn: () => base44.entities.PerformanceGoal.list()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header with Mode Switch */}
      <div className="sticky top-16 z-40 bg-slate-900 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Neuro-Performance Command Center
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Hybrid System: Hardware + Software Intelligence
              </p>
            </div>
            
            {/* Mode Switch */}
            <div className="flex gap-3">
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
                REHAB MODE
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
                PERFORMANCE MODE
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
              <InteractiveBodyMap
                mode={mode}
                onRegionSelect={setSelectedBodyRegion}
                sessions={sessions}
              />
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
                {mode === 'rehab' ? 'REHAB ACTIVE' : 'PERFORMANCE ACTIVE'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}