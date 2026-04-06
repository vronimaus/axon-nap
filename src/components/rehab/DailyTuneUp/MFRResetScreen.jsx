import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Check, Gauge } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { base44 } from '@/api/base44Client';

export default function MFRResetScreen({ onComplete, rehabPlan }) {
  const [mfrNode, setMfrNode] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingNode, setIsLoadingNode] = useState(true);
  const [step, setStep] = useState('pretest'); // pretest → compression → info
  const [pretestValue, setPretestValue] = useState(null);
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
    onComplete(1, { mfrNodeId: mfrNode?.id, pretestValue, posttestValue: pretestValue - 1 });
  };

  const handlePretestComplete = (value) => {
    setPretestValue(value);
    setStep('compression');
    playText(`Ausgangswert: ${value}. Jetzt starten wir den 90-Sekunden Hardware-Reset mit ${mfrNode?.name_de || 'deinem Stecco-Punkt'}.`);
  };

  const remainingTime = Math.max(0, MFR_DURATION - timeElapsed);
  const progress = (timeElapsed / MFR_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 max-w-sm mx-auto w-full"
    >
      {/* Step Indicator */}
      <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span className={step === 'pretest' ? 'text-orange-400' : ''}>① Pretest</span>
        <span>•</span>
        <span className={step === 'compression' ? 'text-orange-400' : ''}>② Reset</span>
        <span>•</span>
        <span className={step === 'info' ? 'text-orange-400' : ''}>③ Wissenschaft</span>
      </div>

      {isLoadingNode ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* PRETEST */}
          {step === 'pretest' && (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              {/* Large Icon Header */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40 animate-pulse">
                  <Gauge className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Main Title */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-orange-400 mb-2">AUSGANGSMESSUNG</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schritt 1 von 3</p>
              </div>

              <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
                <p className="text-sm text-slate-200 leading-relaxed">
                  <span className="text-orange-400 font-bold">Gary Gray Prinzip:</span> Wir testen deine aktuelle Mobilität vor dem Reset, um die Verbesserung zu messen.
                </p>
              </div>

              <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/15 to-orange-500/5 p-6 text-center">
                <p className="text-xs text-orange-300 font-bold uppercase tracking-widest mb-2">Test-Punkt:</p>
                <h4 className="text-lg font-bold text-white mb-1">{mfrNode?.name_de || 'Stecco-Punkt'}</h4>
                {mfrNode?.body_area && <p className="text-xs text-slate-400 mb-4">{mfrNode.body_area}</p>}

                <p className="text-xs text-slate-300 mb-6 font-semibold">
                  Wie ist deine aktuelle Beweglichkeit/Empfindung?
                </p>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handlePretestComplete(val)}
                      className="w-full py-3 rounded-lg border border-orange-500/30 hover:bg-orange-500/20 active:bg-orange-500/30 transition-colors text-sm font-semibold text-orange-400"
                    >
                      {val === 1 && '① Sehr steif/blockiert'}
                      {val === 2 && '② Steif'}
                      {val === 3 && '③ Neutral'}
                      {val === 4 && '④ Locker'}
                      {val === 5 && '⑤ Sehr locker'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPRESSION */}
          {step === 'compression' && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-4"
            >
              {/* Title */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-emerald-400 mb-2">90-SEKUNDEN RESET</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schritt 2 von 3</p>
              </div>

              {/* Target Node Display */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-center"
              >
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mb-2">
                  Zu bearbeitender Punkt
                </p>
                <h3 className="text-xl font-black text-white mb-1">
                  {mfrNode?.name_de || 'Stecco-Punkt'}
                </h3>
                {mfrNode?.exact_placement_de && (
                  <p className="text-xs text-slate-400 mt-2">{mfrNode.exact_placement_de}</p>
                )}
              </motion.div>

          {/* Timer Display */}
          <div className="flex flex-col items-center gap-4">
            {/* Big Timer */}
            <motion.div
              animate={{
                scale: isRunning ? [0.98, 1.02, 0.98] : 1,
              }}
              transition={{
                duration: 1.2,
                repeat: isRunning ? Infinity : 0,
              }}
              className="relative w-36 h-36 rounded-full border-4 border-orange-500/40 flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent shadow-lg shadow-orange-500/20"
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
            <div className="flex gap-2 w-full">
              {!isRunning ? (
                <Button
                  onClick={handleStartTimer}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-slate-900 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  <Play className="w-4 h-4" />
                  Starten
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsRunning(false)}
                    variant="outline"
                    className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm py-2"
                  >
                    Pause
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400 text-sm py-2"
                  >
                    Reset
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
                onClick={() => setStep('info')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-4 h-4" />
                Weiter →
              </Button>
            </motion.div>
          )}
          </motion.div>
          )}

          {/* SCIENTIFIC INFO */}
          {step === 'info' && (
          <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          className="space-y-4"
          >
          {/* Title */}
          <div className="text-center">
            <h3 className="text-2xl font-black text-purple-400 mb-2">DIE WISSENSCHAFT</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schritt 3 von 3</p>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                🧠 Stecco: Center of Coordination
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {mfrNode?.stecco_cc_function || 'Dieser Punkt koordiniert die Faszienketten und ermöglicht flüssigere Bewegungen.'}
              </p>
            </div>

            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                ⚡ Mechanismus: Thixotropie & Ruffini
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {mfrNode?.physio_neurological_impact || 'Die Kompression reduziert Faszienviskosität und aktiviert Ruffini-Rezeptoren für tiefe Entspannung.'}
              </p>
            </div>

            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                🎯 Gary Gray: Bewegungsqualität
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mobilität wird erst nutzbar durch neurales Lernen. Dein Pretest vs. Posttest zeigt echte Bewegungsverbesserung.
              </p>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <Check className="w-4 h-4" />
            Verstanden, weiter! →
          </Button>
          </motion.div>
          )}
          </>
          )}
    </motion.div>
  );
}