import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { SYMPTOM_CLUSTERS } from './SymptomData';

export default function SymptomSelector({ selectedRegion, selectedSymptom, onSymptomSelect }) {
  if (!selectedRegion) return null;
  
  const cluster = SYMPTOM_CLUSTERS[selectedRegion];
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedRegion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-lg font-semibold text-cyan-400">
          Symptome: {cluster.label}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Wähle das Symptom, das dein Problem am besten beschreibt
        </p>
        
        <div className="space-y-2">
          {cluster.symptoms.map((symptomObj, index) => (
            <motion.button
              key={symptomObj.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSymptomSelect(symptomObj)}
              className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center justify-between group touch-target ${
                selectedSymptom?.id === symptomObj.id
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 shadow-lg shadow-cyan-500/30 neuro-glow'
                  : 'glass text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-400'
              }`}
            >
              <div className="flex-1">
                <span className="font-semibold block">{symptomObj.label}</span>
                <span className={`text-xs mt-1 block font-medium ${selectedSymptom?.id === symptomObj.id ? 'text-slate-700' : 'text-slate-500'}`}>
                  Priorität: {symptomObj.prio_chain}
                </span>
              </div>
              {selectedSymptom?.id === symptomObj.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 bg-slate-900/30 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        
        <div className="mt-4 p-3 glass-cyan rounded-2xl border border-cyan-500/30">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-cyan-400">Zu testende Ketten: </span>
            {cluster.triggered_chains.join(', ')}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}