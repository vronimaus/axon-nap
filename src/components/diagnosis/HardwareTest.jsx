import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, HelpCircle, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TestResultButtons = ({ onResult, currentResult }) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('limited')}
      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'limited' 
          ? 'border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20' 
          : 'glass hover:border-red-500/50 hover:shadow-md text-slate-300'
      }`}
    >
      <AlertCircle className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 sm:mb-2 ${currentResult === 'limited' ? 'text-red-400' : 'text-slate-400'}`} />
      <span className="text-xs sm:text-sm font-semibold block leading-tight">Eingeschränkt</span>
      <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 block leading-tight">Spannung/Schmerz</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('moderate')}
      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'moderate' 
          ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20' 
          : 'glass hover:border-amber-500/50 hover:shadow-md text-slate-300'
      }`}
    >
      <HelpCircle className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 sm:mb-2 ${currentResult === 'moderate' ? 'text-amber-400' : 'text-slate-400'}`} />
      <span className="text-xs sm:text-sm font-semibold block leading-tight">Mittel</span>
      <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 block leading-tight">Leicht eingeschränkt</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('good')}
      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'good' 
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20' 
          : 'glass hover:border-emerald-500/50 hover:shadow-md text-slate-300'
      }`}
    >
      <CheckCircle2 className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-1 sm:mb-2 ${currentResult === 'good' ? 'text-emerald-400' : 'text-slate-400'}`} />
      <span className="text-xs sm:text-sm font-semibold block leading-tight">Gut</span>
      <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 block leading-tight">Keine Probleme</span>
    </motion.button>
  </div>
);

export default function HardwareTest({ 
  chain, 
  chainIndex, 
  totalChains, 
  onResult, 
  onNext, 
  onBack, 
  currentResult 
}) {
  const [showInstructions, setShowInstructions] = useState(true);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">
          Hardware-Test {chainIndex + 1} von {totalChains}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalChains }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i < chainIndex ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 neuro-glow' : 
                i === chainIndex ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Chain Info Card */}
      <Card className="p-6 border-0 shadow-xl bg-[#2A2A2A] border border-slate-600">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: chain.color }}
          >
            {chain.code}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-cyan-400">{chain.name_de}</h3>
            <p className="text-sm text-white mt-1">{chain.description}</p>
          </div>
        </div>
      </Card>
      
      {/* Test Card */}
      <Card className="p-6 border-0 shadow-xl bg-[#2A2A2A] border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-cyan-400 flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400" />
            Test: {chain.test_name}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            {showInstructions ? 'Ausblenden' : 'Anleitung zeigen'}
          </Button>
        </div>
        
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#333333] rounded-2xl p-4 mb-4 border border-slate-600">
                <p className="text-white leading-relaxed">
                  {chain.test_instruction}
                </p>
              </div>

              <div className="bg-[#222222] rounded-2xl p-4 border border-cyan-500/30">
                <p className="text-sm text-white">
                  <span className="font-semibold text-cyan-400">Positiver Befund: </span>
                  {chain.test_positive_indicator}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Image Placeholder */}
        <div className="mt-4 bg-slate-800/50 rounded-2xl h-40 flex items-center justify-center border border-slate-600">
          <div className="text-center">
            <Play className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
            <span className="text-sm text-slate-400">Video-Anleitung (Coming Soon)</span>
          </div>
        </div>
        
        <TestResultButtons onResult={onResult} currentResult={currentResult} />
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 touch-target h-12 text-base"
        >
          <ChevronLeft className="w-5 h-5" />
          Zurück
        </Button>
        
        <Button
          onClick={onNext}
          disabled={!currentResult}
          className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 touch-target h-12 text-base shadow-lg shadow-cyan-500/30 neuro-glow font-semibold"
        >
          Weiter
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}