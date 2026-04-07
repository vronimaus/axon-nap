import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Check, MapPin, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MFRResetScreenDynamic({ onComplete, nodeId = 'N1', screenId = 0 }) {
  const [causalChain, setCausalChain] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [step, setStep] = useState('pretest');
  const [pretestValue, setPretestValue] = useState(null);
  const MFR_DURATION = 90;

  useEffect(() => {
    const testPretest = {
      N1: 'Drehe deinen Kopf langsam nach links. Kannst du über deine Schulter hinwegsschauen? Oder schaust du nur zur Seite?',
      N2: 'Neige deinen Kopf zur rechten Schulter. Spürst du einen starken Zug an der linken Halsseite? Oder ist die Bewegung schmerzfrei?',
      N3: 'Strecke beide Arme nach oben über den Kopf. Öffnet sich dein Brustkorb frei? Oder blockiert Schmerz sofort die Bewegung?',
      N4: 'Beuge dich langsam nach vorne. Kannst du deine Zehen berühren? Oder bleibst du bei der Mitte der Schienbeine stecken?',
      N5: 'Stehe auf einem Bein und kippe dein Becken nach oben und unten. Ist die Bewegung flüssig und kontrolliert?',
      N6: 'Hebe beide Arme zur Seite bis über den Kopf. Erreichen deine Arme problemlos die Höhe? Oder bleiben sie unter Schulterhöhe stecken?',
      N7: 'Strecke deinen Arm aus und öffne deine Hand so weit wie möglich. Spreizen deine Finger leicht auseinander?',
      N8: 'Spreize deine Finger maximal auseinander und halte diese Spannung. Hältst du die Spannung leicht? Oder ermüdet deine Hand schnell?',
      N9: 'Stehe auf einem Bein und hebe das andere Knie seitlich. Kommt dein Knie leicht bis Hüfthöhe?',
      N10: 'Mache eine tiefe Kniebeuge. Kommst du tief nach unten? Oder stoppt dich dein Knie schon in der halben Bewegung?',
      N11: 'Stehe auf einem Bein und gehe auf Zehenspitzen. Schaffst du mehrere Schritte auf den Zehen?',
      N12: 'Stehe auf einem Bein und spreize deine Zehen so weit wie möglich. Spreizt dein Fuß gut?'
    };

    const loadCausalChain = async () => {
      try {
        const chains = await base44.entities.TuneUpCausalChain.filter({ node_id: nodeId });
        const chain = chains?.[0];
        if (chain) {
          // Merge with pretest instruction from MFRNode
          setCausalChain({
            ...chain,
            hardware_reset: {
              ...chain.hardware_reset,
              pretest_instruction: chain.hardware_reset?.pretest_instruction || testPretest[nodeId] || ''
            }
          });
        } else {
          // Fallback to test data if no chain found
          setCausalChain({
            node_name_de: `Node ${nodeId}`,
            hardware_reset: {
              pretest_instruction: testPretest[nodeId] || 'Teste deine aktuelle Mobilität'
            }
          });
        }
      } catch (error) {
        console.warn('Error loading causal chain:', error.message);
        // Fallback to test data on error
        setCausalChain({
          node_name_de: `Node ${nodeId}`,
          hardware_reset: {
            pretest_instruction: testPretest[nodeId] || 'Teste deine aktuelle Mobilität'
          }
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    loadCausalChain();
  }, [nodeId]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev >= MFR_DURATION) {
          setIsRunning(false);
          return MFR_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-advance to INFO when timer hits 0
  useEffect(() => {
    if (timeElapsed >= MFR_DURATION && step === 'compression') {
      setTimeout(() => setStep('info'), 500);
    }
  }, [timeElapsed, step]);

  const handleStartTimer = () => setIsRunning(true);
  const handleReset = () => {
    setTimeElapsed(0);
    setIsRunning(false);
  };
  const handleComplete = () => {
    onComplete(screenId, { mfrNodeId: nodeId, pretestValue, posttestValue: pretestValue - 1 });
  };
  const handlePretestComplete = (value) => {
    setPretestValue(value);
    setStep('compression');
  };

  const remainingTime = Math.max(0, MFR_DURATION - timeElapsed);
  const progress = (timeElapsed / MFR_DURATION) * 100;

  if (isLoadingData || !causalChain) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6 max-h-[80vh] overflow-y-auto"
    >


      {/* PRETEST */}
      {step === 'pretest' && (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Beweglichkeitstest</h3>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 space-y-4">
            <div className="pb-4 border-b border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Node</p>
              <h4 className="text-xl font-bold text-white">{causalChain?.node_name_de}</h4>
              {causalChain?.körperregion && <p className="text-xs text-slate-500 mt-1">{causalChain.körperregion}</p>}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Testanleitung</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {causalChain?.hardware_reset?.pretest_instruction || 'Führe eine langsame Bewegung durch und spüre die aktuelle Einschränkung.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Wie ist deine aktuelle Beweglichkeit?</p>
              <div className="space-y-2">
                {[
                   { val: 1, label: 'Sehr limitiert', sub: 'Kaum Bewegung möglich', icon: AlertCircle },
                   { val: 3, label: 'Geht so', sub: 'Eingeschränkt, aber machbar', icon: ChevronRight },
                   { val: 5, label: 'Ganz leicht', sub: 'Volle Beweglichkeit', icon: CheckCircle },
                 ].map(({ val, label, sub, icon: Icon }) => (
                    <motion.button
                      key={val}
                      onClick={() => handlePretestComplete(val)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-4 rounded-lg border bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20 text-slate-300 hover:from-cyan-500/20 hover:to-transparent hover:border-cyan-500/40 hover:text-cyan-400 active:scale-95 transition-all text-left flex items-center gap-3"
                    >
                     <Icon className="w-4 h-4 flex-shrink-0" />
                     <div>
                       <p className="font-semibold text-sm">{label}</p>
                       <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                     </div>
                   </motion.button>
                 ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* COMPRESSION */}
      {step === 'compression' && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Faszien-Entlastung</h3>
                <p className="text-xs text-slate-400">Myofasziale Freigabe</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 space-y-4">
            <div className="pb-4 border-b border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Zu bearbeitender Punkt</p>
              <h4 className="text-xl font-bold text-white">{causalChain?.node_name_de}</h4>
              {causalChain?.stecco_cc && <p className="text-xs text-slate-500 mt-1">{causalChain.stecco_cc}</p>}
            </div>

            {causalChain?.hardware_reset?.technik && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platzierung</p>
                <p className="text-sm text-slate-200">{causalChain.hardware_reset.technik}</p>
              </div>
            )}

            {causalChain?.hardware_reset?.mechanismus && (
              <div className="pt-2 border-t border-slate-700/40">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mechanismus</p>
                <p className="text-xs text-slate-300">{causalChain.hardware_reset.mechanismus}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={{ scale: isRunning ? [0.98, 1.02, 0.98] : 1 }} transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }} className="relative w-36 h-36 rounded-full border-4 border-cyan-500/40 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/20">
              <div className="text-center">
                <span className="text-4xl font-black text-cyan-400 font-mono">{String(Math.floor(remainingTime / 60)).padStart(1, '0')}:{String(remainingTime % 60).padStart(2, '0')}</span>
                <p className="text-xs text-slate-500 mt-2 tracking-widest font-bold">{isRunning ? 'AKTIV' : 'BEREIT'}</p>
              </div>
              <svg className="absolute inset-0 w-full h-full">
                <circle cx="50%" cy="50%" r="72" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                <motion.circle cx="50%" cy="50%" r="72" fill="none" stroke="currentColor" strokeWidth="3" className="text-cyan-500" strokeDasharray={2 * Math.PI * 72} strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }} />
              </svg>
            </motion.div>
            <div className="flex gap-2 w-full">
              {!isRunning ? (
                <Button onClick={handleStartTimer} className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/40 active:scale-95 transition-transform">
                  <Play className="w-4 h-4" />
                  Starten
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsRunning(false)} variant="outline" className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg text-sm">Pause</Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg text-sm">Reset</Button>
                </>
              )}
            </div>
          </div>

        </motion.div>
      )}

      {/* SCIENTIFIC INFO */}
      {step === 'info' && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-5">
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Die Wissenschaft</h3>
                <p className="text-xs text-slate-400">Warum dieser Reset funktioniert</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 space-y-3">
            {causalChain?.biomechanische_ursache && (
              <div className="pb-3 border-b border-slate-700/40">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Biomechanische Ursache</p>
                <p className="text-sm text-slate-200">{causalChain.biomechanische_ursache}</p>
              </div>
            )}

            {causalChain?.hardware_reset?.mechanismus && (
              <div className="pb-3 border-b border-slate-700/40">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MFR-Mechanismus</p>
                <p className="text-sm text-slate-200">{causalChain.hardware_reset.mechanismus}</p>
              </div>
            )}

            {causalChain?.hardware_reset?.biologischer_zweck && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Biologischer Zweck</p>
                <p className="text-sm text-slate-200">{causalChain.hardware_reset.biologischer_zweck}</p>
              </div>
            )}
          </div>

          <Button onClick={handleComplete} className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/40 active:scale-95 transition-transform">
            <Check className="w-4 h-4" />
            Verstanden
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}