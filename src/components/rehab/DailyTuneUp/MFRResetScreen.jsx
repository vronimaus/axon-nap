import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Play, Check } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { base44 } from '@/api/base44Client';

export default function MFRResetScreen({ onComplete, rehabPlan }) {
  const [mfrNode, setMfrNode] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingNode, setIsLoadingNode] = useState(true);
  const { isPlaying, playText } = useTTS();

  const MFR_DURATION = 90; // seconds

  // Load first MFR node from current phase
  useEffect(() => {
    const loadMFRNode = async () => {
      try {
        // Get first MFR exercise from current phase
        const currentPhaseIdx = Math.max(0, (rehabPlan?.current_phase || 1) - 1);
        const currentPhase = rehabPlan?.phases?.[currentPhaseIdx];
        
        if (currentPhase?.exercises) {
          const mfrEx = currentPhase.exercises.find(ex => ex.category === 'mfr');
          if (mfrEx?.exercise_id) {
            const nodes = await base44.entities.MFRNode.filter({});
            const node = nodes?.[0]; // Use first node as example
            setMfrNode(node || { name_de: 'Stecco-Punkt', body_area: 'Schulter' });
          }
        }
        setIsLoadingNode(false);
      } catch (error) {
        console.error('Error loading MFR node:', error);
        setMfrNode({ name_de: 'Stecco-Punkt', body_area: 'Schulter' });
        setIsLoadingNode(false);
      }
    };
    loadMFRNode();
  }, [rehabPlan]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev >= MFR_DURATION) {
          setIsRunning(false);
          playText('Zeit abgelaufen. Sehr gut gemacht!');
          return MFR_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, playText]);

  const handleStartTimer = () => {
    setIsRunning(true);
    playText(`Starte einen 90-Sekunden-Timer für ${mfrNode?.name_de || 'deinen Stecco-Punkt'}. Lass dich auf die Empfindung ein.`);
  };

  const handleReset = () => {
    setTimeElapsed(0);
    setIsRunning(false);
  };

  const handleComplete = () => {
    onComplete(1, { mfrNodeId: mfrNode?.id });
  };

  const remainingTime = Math.max(0, MFR_DURATION - timeElapsed);
  const progress = (timeElapsed / MFR_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-300 text-sm leading-relaxed">
          Drücke den Stecco-Punkt für <span className="font-semibold text-emerald-400">90 Sekunden</span>. Lass dich auf die Sensation ein – das ist der erste Schritt zur Mobilisierung.
        </p>
      </div>

      {isLoadingNode ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Target Node Display */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              Heute: Hardware-Reset
            </p>
            <h3 className="text-2xl font-black text-white mb-1">
              {mfrNode?.name_de || 'Stecco-Punkt'}
            </h3>
            {mfrNode?.body_area && (
              <p className="text-sm text-slate-400">{mfrNode.body_area}</p>
            )}
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center gap-6">
            {/* Big Timer */}
            <motion.div
              animate={{
                scale: isRunning ? [0.98, 1.02, 0.98] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: isRunning ? Infinity : 0,
              }}
              className="relative w-40 h-40 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-slate-900/50"
            >
              <div className="text-center">
                <span className="text-6xl font-black text-emerald-400 font-mono">
                  {String(Math.floor(remainingTime / 60)).padStart(1, '0')}:{String(remainingTime % 60).padStart(2, '0')}
                </span>
                <p className="text-xs text-slate-500 mt-2 tracking-widest font-bold">
                  {isRunning ? 'AKTIV' : 'BEREIT'}
                </p>
              </div>

              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full">
                <circle
                  cx="50%"
                  cy="50%"
                  r="72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-800"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-emerald-500"
                  strokeDasharray={2 * Math.PI * 72}
                  strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
                />
              </svg>
            </motion.div>

            {/* Controls */}
            <div className="flex gap-3 w-full">
              {!isRunning ? (
                <Button
                  onClick={handleStartTimer}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Timer starten
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsRunning(false)}
                    variant="outline"
                    className="flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Pausieren
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400"
                  >
                    Zurücksetzen
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Completion Button */}
          {timeElapsed >= MFR_DURATION && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleComplete}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Reset abgeschlossen →
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}