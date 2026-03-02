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

  const getBarColor = (value) => {
    if (value <= 4) return '#ef4444';
    if (value <= 7) return '#06b6d4';
    return '#06b6d4';
  };

  const getValueLabel = (value) => {
    if (value <= 3) return 'KRITISCH';
    if (value <= 5) return 'NIEDRIG';
    if (value <= 7) return 'NOMINAL';
    if (value <= 9) return 'GUT';
    return 'PEAK';
  };

  const metrics = [
    { icon: Wrench, label: 'HARDWARE', sublabel: 'Körpergefühl', value: feeling, setter: setFeeling, low: 'Steif / eingerostet', high: 'Geschmeidig / frei' },
    { icon: Brain, label: 'SOFTWARE', sublabel: 'Fokus & Kognition', value: focus, setter: setFocus, low: 'Müde / Tunnelblick', high: 'Hellwach / klar' },
    { icon: Zap, label: 'BATTERIE', sublabel: 'Energielevel', value: energy, setter: setEnergy, low: 'Leer / erschöpft', high: 'Volle Kraft' },
  ];

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
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          >
            {/* Header Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-widest uppercase">AXON Bio-Sync</h2>
                  <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">System-Kalibrierung v2.1</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-xs text-slate-300 font-mono tracking-wide border-l-2 border-cyan-500/60 pl-3">
                3 Inputs erforderlich — Kalibrierung läuft
              </p>

              {/* Metric Sliders */}
              {metrics.map(({ icon: Icon, label, sublabel, value, setter, low, high }) => (
                <div key={label} className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</p>
                        <p className="text-[10px] text-slate-600">{sublabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-white">{value}</span>
                      <span className="text-xs text-slate-600 font-mono">/10</span>
                      <p className={`text-[9px] font-bold tracking-widest mt-0.5 ${value <= 4 ? 'text-red-400' : value <= 7 ? 'text-cyan-400' : 'text-cyan-300'}`}>
                        {getValueLabel(value)}
                      </p>
                    </div>
                  </div>

                  {/* Custom progress-style track */}
                  <div className="relative mb-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={value}
                      onChange={(e) => setter(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800"
                      style={{ accentColor: getBarColor(value) }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>◀ {low}</span>
                    <span>{high} ▶</span>
                  </div>
                </div>
              ))}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-11 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:border-cyan-500/70 font-bold tracking-widest text-xs uppercase transition-all shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Analysiere System...
                  </span>
                ) : (
                  '▶  Bio-Sync Starten'
                )}
              </Button>
            </div>
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