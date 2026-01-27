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
        <h3 className="text-lg font-semibold text-slate-800">
          Symptome: {cluster.label}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Wähle das Symptom, das dein Problem am besten beschreibt
        </p>
        
        <div className="space-y-2">
          {cluster.symptoms.map((symptom, index) => (
            <motion.button
              key={symptom}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSymptomSelect(symptom)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                selectedSymptom === symptom
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="font-medium">{symptom}</span>
              {selectedSymptom === symptom && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Zu testende Ketten: </span>
            {cluster.triggered_chains.join(', ')}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}