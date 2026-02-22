import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BioSyncResultCard from './BioSyncResultCard';

export default function DailyReadinessCheck({ user, onClose }) {
  const [feeling, setFeeling] = useState(5); // Hardware: 1=steif, 10=geschmeidig
  const [focus, setFocus] = useState(5); // Software: 1=tunnelblick, 10=hellwach
  const [energy, setEnergy] = useState(5); // Batterie: 1=leer, 10=voll
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Calculate individual statuses (red/yellow/green)
  const getStatus = (value) => {
    if (value <= 4) return 'red';
    if (value <= 7) return 'yellow';
    return 'green';
  };

  // Calculate overall readiness
  const calculateReadiness = () => {
    const feelingStatus = getStatus(feeling);
    const focusStatus = getStatus(focus);
    const energyStatus = getStatus(energy);
    
    // If any is red, overall is red
    if (feelingStatus === 'red' || focusStatus === 'red' || energyStatus === 'red') {
      return { status: 'red', score: (feeling + focus + energy) / 3 };
    }
    // If any is yellow, overall is yellow
    if (feelingStatus === 'yellow' || focusStatus === 'yellow' || energyStatus === 'yellow') {
      return { status: 'yellow', score: (feeling + focus + energy) / 3 };
    }
    // All green
    return { status: 'green', score: (feeling + focus + energy) / 3 };
  };

  const readiness = calculateReadiness();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const checkData = {
        user_email: user.email,
        feeling_hardware: feeling,
        focus_software: focus,
        energy_battery: energy,
        readiness_status: readiness.status,
        readiness_score: Math.round(readiness.score * 10) / 10,
        check_date: today
      };

      await base44.entities.ReadinessCheck.create(checkData);

      // Update user metadata with last check date
      await base44.auth.updateMe({
        last_readiness_check: today,
        current_readiness_status: readiness.status
      });

      toast.success('Bio-Sync abgeschlossen!');
      setShowResults(true);
    } catch (error) {
      console.error('Error saving readiness check:', error);
      toast.error('Fehler beim Speichern');
      setIsSubmitting(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    // Ensure state is synced before closing
    setTimeout(() => onClose(), 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={!showResults ? onClose : undefined}
    >
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="check"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl border border-cyan-500/30 p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">AXON Bio-Sync</h2>
                <p className="text-xs text-slate-500 mt-1">System-Kalibrierung</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              3 schnelle Checks – 10 Sekunden für optimales Training
            </p>

            {/* Feeling (Hardware) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-5 h-5 text-blue-400" />
                <label className="text-sm font-medium text-white">Gefühl (Hardware)</label>
                <span className="ml-auto text-lg font-bold text-blue-400">{feeling}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={feeling}
                onChange={(e) => setFeeling(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: feeling <= 4 ? '#ef4444' : feeling <= 7 ? '#f59e0b' : '#22c55e'
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>🔴 Steif (eingerostet)</span>
                <span>🟢 Geschmeidig (wie geölt)</span>
              </div>
            </div>

            {/* Focus (Software) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-cyan-400" />
                <label className="text-sm font-medium text-white">Fokus (Software)</label>
                <span className="ml-auto text-lg font-bold text-cyan-400">{focus}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={focus}
                onChange={(e) => setFocus(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: focus <= 4 ? '#ef4444' : focus <= 7 ? '#f59e0b' : '#22c55e'
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>🔴 Müde (Tunnelblick)</span>
                <span>🟢 Hellwach (klar)</span>
              </div>
            </div>

            {/* Energy (Battery) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-400" />
                <label className="text-sm font-medium text-white">Batterie (Energie)</label>
                <span className="ml-auto text-lg font-bold text-purple-400">{energy}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: energy <= 4 ? '#ef4444' : energy <= 7 ? '#f59e0b' : '#22c55e'
                }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>🔴 Akku leer</span>
                <span>🟢 Volle Kraft</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              {isSubmitting ? 'Analysiere System...' : 'Bio-Sync starten'}
            </Button>
          </motion.div>
        ) : (
          <BioSyncResultCard
            feeling={feeling}
            focus={focus}
            energy={energy}
            readinessStatus={readiness.status}
            onClose={handleCloseResults}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}