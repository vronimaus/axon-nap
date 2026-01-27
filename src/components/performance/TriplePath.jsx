import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Maximize2, Dumbbell, Brain, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ExerciseModal from './ExerciseModal';

const STEPS = [
  { key: 'mobilisation', title: 'Mobilisation', icon: Activity, color: 'cyan', description: 'Gelenk-Freiheit' },
  { key: 'stretch', title: 'Dehnung', icon: Maximize2, color: 'purple', description: 'Faszien-Länge' },
  { key: 'strength', title: 'Kräftigung', icon: Dumbbell, color: 'amber', description: 'Neuronale Sicherheit' },
  { key: 'neuro_fix', title: 'Neuro-Fix', icon: Brain, color: 'emerald', description: 'Nervensystem-Boost' }
];

export default function TriplePath({ goal, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const step = STEPS[currentStep];
  const nameKey = `${step.key}_name`;
  const instructionKey = `${step.key}_instruction`;
  
  // Fetch all exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list()
  });
  
  // Find matching exercise by name
  const currentExerciseName = goal[nameKey];
  const exerciseInfo = exercises.find(ex => 
    ex.name.toLowerCase() === currentExerciseName?.toLowerCase()
  );
  
  const openExerciseModal = () => {
    if (exerciseInfo) {
      setSelectedExercise(exerciseInfo);
      setIsModalOpen(true);
    }
  };
  
  const handleComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const allCompleted = completedSteps.length === STEPS.length;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="touch-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-cyan-400">{goal.name}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Triple-Path: Mobilisation → Dehnung → Kräftigung → Neuro-Fix
          </p>
        </div>
      </div>
      
      {/* Info Card */}
      <Card className="p-5 border-0 shadow-xl glass-cyan border border-cyan-500/30">
        <p className="text-sm text-slate-300 leading-relaxed">
          💡 <span className="font-semibold text-cyan-400">Logik:</span> Wir nutzen <strong>Mobilisation</strong> für das Gelenk, 
          <strong> Dehnung</strong> für die Faszie und <strong>Kräftigung</strong> für die neuronale Sicherheit. 
          Der <strong>Neuro-Fix</strong> optimiert dein Nervensystem für maximale Performance.
        </p>
      </Card>
      
      {/* Progress Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === currentStep;
          const isCompleted = completedSteps.includes(idx);
          
          return (
            <button
              key={s.key}
              onClick={() => setCurrentStep(idx)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isActive 
                  ? `border-${s.color}-500 bg-${s.color}-500/20 neuro-glow` 
                  : isCompleted
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'glass border-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${
                isActive ? `text-${s.color}-400` : isCompleted ? 'text-emerald-400' : 'text-slate-500'
              }`} />
              <span className={`text-xs font-medium block ${
                isActive ? `text-${s.color}-400` : isCompleted ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {s.title}
              </span>
              {isCompleted && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="p-6 border-0 shadow-xl glass">
            <div className={`flex items-center gap-3 mb-4 pb-4 border-b border-${step.color}-500/30`}>
              <div 
                className={`w-12 h-12 rounded-2xl bg-${step.color}-500/20 flex items-center justify-center border-2 border-${step.color}-500/40`}
              >
                <step.icon className={`w-6 h-6 text-${step.color}-400`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold text-${step.color}-400`}>
                    {goal[nameKey]}
                  </h3>
                  {exerciseInfo && (
                    <button
                      onClick={openExerciseModal}
                      className="w-8 h-8 rounded-lg glass hover:glass-cyan border border-cyan-500/30 flex items-center justify-center transition-all group"
                      title="Details zur Übung"
                    >
                      <Info className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">{step.description}</p>
              </div>
            </div>
            
            <div className={`glass-${step.color} rounded-2xl p-5 border border-${step.color}-500/30 mb-6`}>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {goal[instructionKey]}
              </p>
            </div>
            
            {/* Video Placeholder */}
            <div className={`glass rounded-2xl h-48 flex items-center justify-center border border-${step.color}-500/20 mb-6`}>
              <div className="text-center text-slate-500">
                <step.icon className={`w-12 h-12 mx-auto mb-2 opacity-50 text-${step.color}-400`} />
                <span className="text-sm">Video-Anleitung (Coming Soon)</span>
              </div>
            </div>
            
            <Button
              onClick={handleComplete}
              className={`w-full bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 hover:from-${step.color}-600 hover:to-${step.color}-700 text-white h-12 text-base font-semibold shadow-lg shadow-${step.color}-500/30`}
            >
              {currentStep < STEPS.length - 1 ? 'Abgeschlossen – Nächster Schritt' : 'Training abschließen'}
            </Button>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Exercise Modal */}
      <ExerciseModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Completion */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 border-0 shadow-xl glass-cyan border-2 border-emerald-500/50 neuro-glow">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                🎉 Triple-Path abgeschlossen!
              </h3>
              <p className="text-slate-300">
                Du hast alle 4 Schritte für <strong className="text-cyan-400">{goal.name}</strong> durchlaufen. 
                Wiederhole diese Routine regelmäßig für optimale Ergebnisse.
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}