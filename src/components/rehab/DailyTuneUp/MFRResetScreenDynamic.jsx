import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Check, Gauge, MapPin } from 'lucide-react';
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
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span className={step === 'pretest' ? 'text-orange-400' : ''}>① Pretest</span>
        <span>•</span>
        <span className={step === 'compression' ? 'text-orange-400' : ''}>② Reset</span>
        <span>•</span>
        <span className={step === 'info' ? 'text-orange-400' : ''}>③ Wissenschaft</span>
      </div>

      {/* PRETEST */}
      {step === 'pretest' && (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40 animate-pulse">
              <Gauge className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-center mb-2">
            <h3 className="text-3xl font-black text-orange-400 mb-1 leading-tight">AUSGANGSMESSUNG</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Schritt 1 von 3</p>
          </div>
          <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-5">
            <p className="text-sm text-slate-200 leading-relaxed">
              <strong className="text-orange-400">Symptom:</strong> {causalChain?.symptom}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-500/40 bg-gradient-to-br from-orange-500/15 to-orange-500/5 p-6 text-center space-y-4">
            <div>
              <p className="text-xs text-orange-300 font-bold uppercase tracking-widest mb-2">Node:</p>
              <h4 className="text-lg font-bold text-white mb-1">{causalChain?.node_name_de}</h4>
              <p className="text-xs text-slate-400">{causalChain?.körperregion}</p>
            </div>

            {/* Test-Bewegungs-Anleitung */}
            <div className="border-t border-orange-500/20 pt-4">
              <p className="text-xs text-orange-300 font-bold uppercase tracking-widest mb-2">📋 So testest du:</p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {causalChain?.hardware_reset?.pretest_instruction || 'Führe eine langsame Bewegung durch und spüre die aktuelle Einschränkung.'}
              </p>
            </div>

            <p className="text-xs text-slate-300 font-semibold">Wie ist deine aktuelle Beweglichkeit/Empfindung?</p>
            <div className="space-y-3 mt-2">
              {[
                { val: 1, label: 'Sehr limitiert', icon: '⚠️', sub: 'Kaum Bewegung möglich', color: 'border-red-500/40 hover:bg-red-500/15 text-red-400' },
                { val: 3, label: 'Geht so', icon: '📐', sub: 'Eingeschränkt, aber machbar', color: 'border-orange-500/40 hover:bg-orange-500/15 text-orange-400' },
                { val: 5, label: 'Ganz leicht', icon: '✅', sub: 'Volle Beweglichkeit', color: 'border-emerald-500/40 hover:bg-emerald-500/15 text-emerald-400' },
              ].map(({ val, label, icon, sub, color }) => (
                <button
                  key={val}
                  onClick={() => handlePretestComplete(val)}
                  className={`w-full py-4 px-4 rounded-xl border ${color} bg-slate-800/40 active:scale-[0.97] transition-all text-left flex items-center gap-3`}
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* COMPRESSION */}
      {step === 'compression' && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-6">
          <div className="text-center mb-2">
            <h3 className="text-3xl font-black text-emerald-400 mb-1 leading-tight">90-SEKUNDEN RESET</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Schritt 2 von 3</p>
          </div>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 text-center">
            <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mb-2">Zu bearbeitender Punkt</p>
            <h3 className="text-xl font-black text-white mb-1">{causalChain?.node_name_de}</h3>
            <p className="text-xs text-slate-400 mt-2">{causalChain?.stecco_cc}</p>
          </motion.div>
          {causalChain?.hardware_reset?.technik && (
            <div className="bg-slate-800/70 border border-cyan-500/30 rounded-xl px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Technik</p>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{causalChain.hardware_reset.technik}</p>
            </div>
          )}
          <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              🎯 <span className="text-emerald-400 font-semibold">Mechanismus:</span> {causalChain?.hardware_reset?.mechanismus}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={{ scale: isRunning ? [0.98, 1.02, 0.98] : 1 }} transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }} className="relative w-36 h-36 rounded-full border-4 border-orange-500/40 flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent shadow-lg shadow-orange-500/20">
              <div className="text-center">
                <span className="text-6xl font-black text-emerald-400 font-mono">{String(Math.floor(remainingTime / 60)).padStart(1, '0')}:{String(remainingTime % 60).padStart(2, '0')}</span>
                <p className="text-xs text-slate-500 mt-2 tracking-widest font-bold">{isRunning ? 'AKTIV' : 'BEREIT'}</p>
              </div>
              <svg className="absolute inset-0 w-full h-full">
                <circle cx="50%" cy="50%" r="72" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                <motion.circle cx="50%" cy="50%" r="72" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" strokeDasharray={2 * Math.PI * 72} strokeDashoffset={2 * Math.PI * 72 * (1 - progress / 100)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }} />
              </svg>
            </motion.div>
            <div className="flex gap-3 w-full">
              {!isRunning ? (
                <Button onClick={handleStartTimer} className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/40 active:scale-95 transition-transform">
                  <Play className="w-4 h-4" />
                  Starten
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsRunning(false)} className="flex-1 h-14 border-2 border-orange-500/40 text-orange-400 hover:bg-orange-500/10 font-bold rounded-xl text-sm active:scale-95 transition-all">Pause</Button>
                  <Button onClick={handleReset} className="flex-1 h-14 border-2 border-slate-600 text-slate-400 hover:bg-slate-700/30 font-bold rounded-xl text-sm active:scale-95 transition-all">Reset</Button>
                </>
              )}
            </div>
          </div>
          {timeElapsed >= MFR_DURATION && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button onClick={() => setStep('info')} className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform">
                <Check className="w-4 h-4" />
                Weiter →
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* SCIENTIFIC INFO */}
      {step === 'info' && (
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-6">
          <div className="text-center mb-2">
            <h3 className="text-3xl font-black text-purple-400 mb-1 leading-tight">DIE WISSENSCHAFT</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Schritt 3 von 3</p>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">🧠 WEIL (Biomechanische Ursache)</p>
              <p className="text-xs text-slate-300 leading-relaxed">{causalChain?.biomechanische_ursache}</p>
            </div>
            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">⚡ Hardware Reset: Mechanismus</p>
              <p className="text-xs text-slate-300 leading-relaxed">{causalChain?.hardware_reset?.mechanismus}</p>
            </div>
            <div className="border-t border-slate-700 pt-3">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">🎯 Biologischer Zweck</p>
              <p className="text-xs text-slate-300 leading-relaxed">{causalChain?.hardware_reset?.biologischer_zweck}</p>
            </div>
          </div>
          <Button onClick={handleComplete} className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform">
            <Check className="w-4 h-4" />
            Verstanden, weiter! →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}