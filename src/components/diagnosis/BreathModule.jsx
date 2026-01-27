import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Heart, AlertCircle, CheckCircle2, ArrowRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BoxBreathingTimer = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState(0); // 0: inhale, 1: hold, 2: exhale, 3: hold
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const phases = ['Einatmen', 'Halten', 'Ausatmen', 'Halten'];
  const duration = 4; // seconds per phase
  const totalCycles = 3;
  
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= duration) {
          setPhase(p => {
            const nextPhase = (p + 1) % 4;
            if (nextPhase === 0) {
              setCycles(c => {
                const newCycles = c + 1;
                if (newCycles >= totalCycles) {
                  setIsRunning(false);
                  setTimeout(onComplete, 500);
                }
                return newCycles;
              });
            }
            return nextPhase;
          });
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, onComplete]);
  
  const progress = (count / duration) * 100;
  const scale = phase === 0 ? 1 + (count / duration) * 0.3 : 
                phase === 2 ? 1.3 - (count / duration) * 0.3 : 1.3;
  
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        {/* Animated Circle */}
        <motion.div
          animate={{ scale }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-2xl"
          style={{
            boxShadow: `0 0 ${40 + scale * 20}px rgba(6, 182, 212, 0.4)`
          }}
        >
          <div className="w-40 h-40 rounded-full bg-slate-900 flex flex-col items-center justify-center">
            <p className="text-cyan-400 text-sm font-semibold mb-1">{phases[phase]}</p>
            <p className="text-white text-4xl font-bold">{Math.ceil(duration - count)}</p>
          </div>
        </motion.div>
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="95"
            fill="none"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="4"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="95"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 95}`}
            strokeDashoffset={`${2 * Math.PI * 95 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="text-center">
        <p className="text-slate-400 text-sm">Zyklus {cycles + 1} von {totalCycles}</p>
        <Button
          onClick={() => setIsRunning(!isRunning)}
          className="mt-3 bg-cyan-500 hover:bg-cyan-600"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
      </div>
    </div>
  );
};

export default function BreathModule({ symptomType, onComplete, onSkip }) {
  const [needsBreathCheck, setNeedsBreathCheck] = useState(null);
  const [ribcageExpansion, setRibcageExpansion] = useState(null);
  const [tongueRoof, setTongueRoof] = useState(null);
  const [showBoxBreathing, setShowBoxBreathing] = useState(false);
  const [breathCompleted, setBreathCompleted] = useState(false);
  
  const breathRelevantSymptoms = ['hals_nacken', 'lws', 'rumpf', 'systemisch'];
  const isRelevant = breathRelevantSymptoms.includes(symptomType);
  
  if (!isRelevant && needsBreathCheck === null) {
    onSkip();
    return null;
  }
  
  const handleBreathResponse = (answer) => {
    setNeedsBreathCheck(answer);
    if (!answer) {
      onSkip();
    }
  };
  
  const handleTestComplete = () => {
    const breathIssue = ribcageExpansion === 'limited' || tongueRoof === 'difficult';
    
    if (breathIssue && !showBoxBreathing) {
      setShowBoxBreathing(true);
    } else {
      onComplete({
        breath_check_performed: true,
        ribcage_expansion: ribcageExpansion,
        tongue_roof: tongueRoof,
        breath_issue_detected: breathIssue,
        box_breathing_completed: breathCompleted
      });
    }
  };
  
  const handleBoxBreathingComplete = () => {
    setBreathCompleted(true);
  };
  
  const handleContinue = () => {
    onComplete({
      breath_check_performed: true,
      ribcage_expansion: ribcageExpansion,
      tongue_roof: tongueRoof,
      breath_issue_detected: true,
      box_breathing_completed: breathCompleted
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-cyan rounded-2xl p-6 border border-cyan-500/30"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cyan-400">Zwerchfell-Motorik & Core-Sicherheit</h3>
            <p className="text-xs text-slate-400">Atmung als myofaszialer Stabilisator</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Das Zwerchfell ist Teil der Tiefen Frontallinie (DFL). Eine freie Atmung signalisiert deinem Gehirn Sicherheit und lässt die äußeren Muskelketten locker.
        </p>
      </motion.div>
      
      {/* Step 1: Breath Check Question */}
      {needsBreathCheck === null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h4 className="text-lg font-semibold text-cyan-400 mb-4">
            Fühlst du Stress oder einen hohen Muskeltonus?
          </h4>
          <p className="text-sm text-slate-400 mb-4">
            Chronische Anspannung kann über das Zwerchfell deine gesamte Körperstatik beeinflussen.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleBreathResponse(true)}
              className="h-20 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-2 border-cyan-500/30 hover:border-cyan-500 text-cyan-400 font-semibold"
            >
              Ja, oft gestresst/angespannt
            </Button>
            <Button
              onClick={() => handleBreathResponse(false)}
              variant="outline"
              className="h-20 border-slate-600 hover:border-slate-500 text-slate-400"
            >
              Nein, entspannt
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Step 2: Breath Tests */}
      {needsBreathCheck === true && !showBoxBreathing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Ribcage Expansion Test */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-200 mb-2">360-Grad-Rippen-Check</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Lege deine Hände an die unteren Rippen (seitlich). Atme tief ein. Weiten sich die Rippen in alle Richtungen (auch nach hinten/seitlich)?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setRibcageExpansion('full')}
                    variant={ribcageExpansion === 'full' ? 'default' : 'outline'}
                    className={ribcageExpansion === 'full' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Ja, 360-Grad
                  </Button>
                  <Button
                    onClick={() => setRibcageExpansion('limited')}
                    variant={ribcageExpansion === 'limited' ? 'default' : 'outline'}
                    className={ribcageExpansion === 'limited' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Nur nach vorne
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tongue-Roof Test */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-200 mb-2">Zungen-Gaumen-Kontakt</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Drücke die gesamte Zunge flach gegen den Gaumen (nicht nur die Spitze). Kannst du das halten, während du normal atmest?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setTongueRoof('easy')}
                    variant={tongueRoof === 'easy' ? 'default' : 'outline'}
                    className={tongueRoof === 'easy' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Ja, einfach
                  </Button>
                  <Button
                    onClick={() => setTongueRoof('difficult')}
                    variant={tongueRoof === 'difficult' ? 'default' : 'outline'}
                    className={tongueRoof === 'difficult' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Schwierig/verkrampft
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {ribcageExpansion && tongueRoof && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleTestComplete}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12 font-semibold neuro-glow"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Step 3: Box Breathing */}
      {showBoxBreathing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-purple rounded-2xl p-6 border border-purple-500/30">
            <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Sofort-Drill: Box Breathing (4-4-4-4)
            </h4>
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Deine Atmung zeigt Einschränkungen. Das Box Breathing aktiviert den Parasympathikus und entspannt die gesamte myofasziale Kette.
              </p>
              
              <BoxBreathingTimer 
                isActive={showBoxBreathing}
                onComplete={handleBoxBreathingComplete}
              />
              
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                <p className="text-xs text-cyan-400 font-semibold mb-1">🧠 Neurologischer Hintergrund:</p>
                <p className="text-xs text-slate-400">
                  Das Zwerchfell ist der Hauptatemmuskel und Teil der DFL. Kontrollierte Atmung senkt den Sympathikus-Tonus 
                  und signalisiert dem Gehirn "Sicherheit" – wodurch defensive Muskelspannung nachlässt.
                </p>
              </div>
            </div>
          </div>
          
          {breathCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12 font-semibold neuro-glow"
              >
                Drill abgeschlossen – Weiter zu den Tests
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}