import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Brain, Zap, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ConfettiEffect from './ConfettiEffect';
import BreathGuide from './BreathGuide';

const ImprovementButtons = ({ onResult, currentResult }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleImproved = () => {
    onResult('improved');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3100);
  };
  
  return (
    <>
      <ConfettiEffect trigger={showConfetti} />
      <div className="grid grid-cols-3 gap-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleImproved}
          className={`p-5 rounded-2xl border-2 transition-all touch-target ${
            currentResult === 'improved' 
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20 pulse-success' 
              : 'glass hover:border-emerald-500/50 hover:shadow-md text-slate-300'
          }`}
        >
          <TrendingUp className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'improved' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-sm font-semibold block">Verbessert</span>
          <span className="text-xs text-slate-500 mt-1 block">Deutlich besser</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onResult('unchanged')}
          className={`p-5 rounded-2xl border-2 transition-all touch-target ${
            currentResult === 'unchanged' 
              ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20' 
              : 'glass hover:border-amber-500/50 hover:shadow-md text-slate-300'
          }`}
        >
          <Minus className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'unchanged' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="text-sm font-semibold block">Unverändert</span>
          <span className="text-xs text-slate-500 mt-1 block">Keine Veränderung</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onResult('worse')}
          className={`p-5 rounded-2xl border-2 transition-all touch-target ${
            currentResult === 'worse' 
              ? 'border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20' 
              : 'glass hover:border-red-500/50 hover:shadow-md text-slate-300'
          }`}
        >
          <TrendingDown className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'worse' ? 'text-red-400' : 'text-slate-400'}`} />
          <span className="text-sm font-semibold block">Schlechter</span>
          <span className="text-xs text-slate-500 mt-1 block">Verschlechtert</span>
        </motion.button>
      </div>
    </>
  );
};

export default function NeuroDrill({ 
  chain, 
  chainIndex, 
  totalChains, 
  hardwareResult,
  onResult, 
  onNext, 
  onBack, 
  currentResult 
}) {
  const [drillCompleted, setDrillCompleted] = useState(false);
  
  // Skip if hardware test was good
  if (hardwareResult === 'good') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="p-6 border-0 shadow-xl glass border border-slate-700">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">
              Kein Neuro-Drill erforderlich
            </h3>
            <p className="text-slate-400">
              Der Hardware-Test für <strong className="text-cyan-400">{chain.name_de}</strong> war unauffällig.
              Wir überspringen den Neuro-Drill für diese Kette.
            </p>
          </div>
        </Card>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2 touch-target h-12 text-base">
            <ChevronLeft className="w-5 h-5" />
            Zurück
          </Button>
          <Button onClick={() => { onResult('skipped'); onNext(); }} className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 touch-target h-12 text-base shadow-lg shadow-cyan-500/30 neuro-glow font-semibold">
            Weiter
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <BreathGuide isActive={true} />
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">
          Neuro-Drill {chainIndex + 1} von {totalChains}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalChains }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i < chainIndex ? 'bg-gradient-to-r from-purple-500 to-purple-600 neuro-glow-purple' : 
                i === chainIndex ? 'bg-purple-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Chain Info Card */}
      <Card className="p-6 border-0 shadow-xl glass border border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-400">{chain.neuro_marker}</h3>
            <p className="text-sm text-slate-400 mt-1">
              Neuro-Drill für: {chain.name_de}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Drill Instructions */}
      <Card className="p-6 border-0 shadow-xl glass border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <h4 className="font-semibold text-purple-400">Anleitung</h4>
        </div>
        
        <div className="glass rounded-2xl p-4 mb-4 border border-slate-700">
          <p className="text-slate-400 leading-relaxed">
            {chain.neuro_instruction}
          </p>
        </div>
        
        {/* Video Placeholder */}
        <div className="glass rounded-2xl h-40 flex items-center justify-center border border-slate-700">
          <div className="text-center text-slate-600">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
            <span className="text-sm text-slate-500">Video-Anleitung (Coming Soon)</span>
          </div>
        </div>
        
        {!drillCompleted ? (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setDrillCompleted(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 gap-2 text-white shadow-lg shadow-purple-500/30 neuro-glow-purple"
            >
              <RotateCcw className="w-5 h-5" />
              Drill durchgeführt – Jetzt Re-Test
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="glass border border-purple-500/30 rounded-2xl p-4 mb-4">
              <p className="text-sm text-purple-400 font-medium">
                🔄 Führe jetzt den Hardware-Test "{chain.test_name}" erneut durch und bewerte die Veränderung:
              </p>
            </div>
            <ImprovementButtons onResult={onResult} currentResult={currentResult} />
          </div>
        )}
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2 touch-target h-12 text-base">
          <ChevronLeft className="w-5 h-5" />
          Zurück
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!currentResult}
          className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white touch-target h-12 text-base shadow-lg shadow-purple-500/30 neuro-glow-purple font-semibold"
        >
          Weiter
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}