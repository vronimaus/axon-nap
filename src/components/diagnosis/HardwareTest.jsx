import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, HelpCircle, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const TestResultButtons = ({ onResult, currentResult }) => (
  <div className="grid grid-cols-3 gap-3 mt-6">
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('limited')}
      className={`p-5 rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'limited' 
          ? 'border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-100' 
          : 'glass hover:border-red-300 hover:shadow-md'
      }`}
    >
      <AlertCircle className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'limited' ? 'text-red-500' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold block">Eingeschränkt</span>
      <span className="text-xs text-slate-500 mt-1 block">Spannung/Schmerz</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('moderate')}
      className={`p-5 rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'moderate' 
          ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-lg shadow-amber-100' 
          : 'glass hover:border-amber-300 hover:shadow-md'
      }`}
    >
      <HelpCircle className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'moderate' ? 'text-amber-500' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold block">Mittel</span>
      <span className="text-xs text-slate-500 mt-1 block">Leicht eingeschränkt</span>
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onResult('good')}
      className={`p-5 rounded-2xl border-2 transition-all touch-target ${
        currentResult === 'good' 
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' 
          : 'glass hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      <CheckCircle2 className={`w-7 h-7 mx-auto mb-2 ${currentResult === 'good' ? 'text-emerald-500' : 'text-slate-400'}`} />
      <span className="text-sm font-semibold block">Gut</span>
      <span className="text-xs text-slate-500 mt-1 block">Keine Probleme</span>
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
        <span className="text-sm text-slate-500">
          Hardware-Test {chainIndex + 1} von {totalChains}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalChains }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i < chainIndex ? 'bg-blue-600' : 
                i === chainIndex ? 'bg-blue-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Chain Info Card */}
      <Card className="p-6 border-0 shadow-xl glass-cyan neuro-glow">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: chain.color }}
          >
            {chain.code}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800">{chain.name_de}</h3>
            <p className="text-sm text-slate-500 mt-1">{chain.description}</p>
          </div>
        </div>
      </Card>
      
      {/* Test Card */}
      <Card className="p-6 border-0 shadow-xl glass">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-600" />
            Test: {chain.test_name}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-slate-500"
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
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-slate-700 leading-relaxed">
                  {chain.test_instruction}
                </p>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Positiver Befund: </span>
                  {chain.test_positive_indicator}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Image Placeholder */}
        <div className="mt-4 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl h-40 flex items-center justify-center border-2 border-dashed border-slate-200">
          <div className="text-center text-slate-400">
            <Play className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <span className="text-sm">Video-Anleitung (Coming Soon)</span>
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