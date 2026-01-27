import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Brain, Zap, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ImprovementButtons = ({ onResult, currentResult }) => (
  <div className="grid grid-cols-3 gap-3 mt-6">
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onResult('improved')}
      className={`p-4 rounded-xl border-2 transition-all ${
        currentResult === 'improved' 
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
      }`}
    >
      <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${currentResult === 'improved' ? 'text-emerald-500' : 'text-slate-400'}`} />
      <span className="text-sm font-medium block">Verbessert</span>
      <span className="text-xs text-slate-500 mt-1 block">Deutlich besser</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onResult('unchanged')}
      className={`p-4 rounded-xl border-2 transition-all ${
        currentResult === 'unchanged' 
          ? 'border-amber-500 bg-amber-50 text-amber-700' 
          : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
      }`}
    >
      <Minus className={`w-6 h-6 mx-auto mb-2 ${currentResult === 'unchanged' ? 'text-amber-500' : 'text-slate-400'}`} />
      <span className="text-sm font-medium block">Unverändert</span>
      <span className="text-xs text-slate-500 mt-1 block">Keine Veränderung</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onResult('worse')}
      className={`p-4 rounded-xl border-2 transition-all ${
        currentResult === 'worse' 
          ? 'border-red-500 bg-red-50 text-red-700' 
          : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
      }`}
    >
      <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${currentResult === 'worse' ? 'text-red-500' : 'text-slate-400'}`} />
      <span className="text-sm font-medium block">Schlechter</span>
      <span className="text-xs text-slate-500 mt-1 block">Verschlechtert</span>
    </motion.button>
  </div>
);

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
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Kein Neuro-Drill erforderlich
            </h3>
            <p className="text-slate-600">
              Der Hardware-Test für <strong>{chain.name_de}</strong> war unauffällig.
              Wir überspringen den Neuro-Drill für diese Kette.
            </p>
          </div>
        </Card>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
          <Button onClick={() => { onResult('skipped'); onNext(); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
            Weiter
            <ChevronRight className="w-4 h-4" />
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
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">
          Neuro-Drill {chainIndex + 1} von {totalChains}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalChains }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i < chainIndex ? 'bg-purple-600' : 
                i === chainIndex ? 'bg-purple-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Chain Info Card */}
      <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800">{chain.neuro_marker}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Neuro-Drill für: {chain.name_de}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Drill Instructions */}
      <Card className="p-6 border-0 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-slate-800">Anleitung</h4>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4 mb-4">
          <p className="text-slate-700 leading-relaxed">
            {chain.neuro_instruction}
          </p>
        </div>
        
        {/* Video Placeholder */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl h-40 flex items-center justify-center border-2 border-dashed border-slate-200">
          <div className="text-center text-slate-400">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <span className="text-sm">Video-Anleitung (Coming Soon)</span>
          </div>
        </div>
        
        {!drillCompleted ? (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setDrillCompleted(true)}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Drill durchgeführt – Jetzt Re-Test
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium">
                🔄 Führe jetzt den Hardware-Test "{chain.test_name}" erneut durch und bewerte die Veränderung:
              </p>
            </div>
            <ImprovementButtons onResult={onResult} currentResult={currentResult} />
          </div>
        )}
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!currentResult}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          Weiter
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}