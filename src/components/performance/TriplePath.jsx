import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Maximize2, Dumbbell, Brain, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ExerciseModal from './ExerciseModal';

const STEPS = [
  { key: 'mobilisation', title: 'Mobilisation', icon: Activity, color: 'cyan', borderClass: 'border-cyan-500', bgClass: 'bg-cyan-500/30', iconClass: 'text-cyan-400', description: 'Gelenk-Freiheit' },
  { key: 'stretch', title: 'Dehnung', icon: Maximize2, color: 'purple', borderClass: 'border-purple-500', bgClass: 'bg-purple-500/30', iconClass: 'text-purple-400', description: 'Faszien-Länge' },
  { key: 'strength', title: 'Kräftigung', icon: Dumbbell, color: 'amber', borderClass: 'border-amber-500', bgClass: 'bg-amber-500/30', iconClass: 'text-amber-400', description: 'Neuronale Sicherheit' },
  { key: 'neuro_fix', title: 'Neuro-Fix', icon: Brain, color: 'emerald', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/30', iconClass: 'text-emerald-400', description: 'Nervensystem-Boost' }
];

export default function TriplePath({ goal, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedGoal, setUpdatedGoal] = useState(goal);

  // Generate goal images on mount
  useEffect(() => {
    if (goal?.id) {
      base44.functions.invoke('generateGoalImages', { goalId: goal.id })
        .then(res => {
          if (res.data?.goal) {
            setUpdatedGoal(res.data.goal);
          }
        })
        .catch(err => {
          console.error('Image generation failed:', err);
        });
    }
  }, [goal?.id]);
  
  const step = STEPS[currentStep];
  const nameKey = `${step.key}_name`;
  const instructionKey = `${step.key}_instruction`;
  const imageKey = step.key === 'mobilisation' ? 'image_url' : step.key === 'stretch' ? 'gif_url' : null;
  
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
      <Card className="p-5 border-0 shadow-xl bg-[#222222] border border-slate-600">
        <p className="text-sm text-white leading-relaxed">
          💡 <span className="font-bold text-cyan-400">Logik:</span> Wir nutzen <strong className="text-white">Mobilisation</strong> für das Gelenk, 
          <strong className="text-white"> Dehnung</strong> für die Faszie und <strong className="text-white">Kräftigung</strong> für die neuronale Sicherheit. 
          Der <strong className="text-white">Neuro-Fix</strong> optimiert dein Nervensystem für maximale Performance.
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
                  ? `${s.borderClass} ${s.bgClass} neuro-glow` 
                  : isCompleted
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'bg-slate-800 border-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${
                isActive ? `text-white` : isCompleted ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              <span className={`text-xs font-semibold block ${
                isActive ? `text-white` : isCompleted ? 'text-emerald-400' : 'text-slate-400'
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
          <Card className="p-6 border-0 shadow-xl bg-[#2A2A2A] border border-slate-600">
            <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${step.borderClass}/30`}>
              <div 
                className={`w-12 h-12 rounded-2xl ${step.bgClass}/70 flex items-center justify-center border-2 ${step.borderClass}/40`}
              >
                <step.icon className={`w-6 h-6 ${step.iconClass}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold text-cyan-400`}>
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
                <p className="text-xs text-slate-500">{step.description}</p>
              </div>
            </div>
            
            <div className={`bg-[#333333] rounded-2xl p-5 border border-slate-600 mb-6`}>
              <p className="text-white leading-relaxed whitespace-pre-line">
                {goal[instructionKey]}
              </p>
            </div>
            
            {/* Exercise Image or Placeholder */}
            <div className={`glass rounded-2xl overflow-hidden border border-slate-700 mb-6 h-96 sm:h-[500px]`}>
              {imageKey && updatedGoal[imageKey] ? (
                <img 
                  src={updatedGoal[imageKey]} 
                  alt={currentExerciseName}
                  className="w-full h-full object-contain bg-black"
                />
              ) : exerciseInfo?.image_url ? (
                <img 
                  src={exerciseInfo.image_url} 
                  alt={currentExerciseName}
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-slate-600">
                    <step.icon className={`w-16 h-16 mx-auto mb-3 opacity-30 ${step.iconClass}`} />
                    <span className="text-sm text-slate-500">Bild wird geladen...</span>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleComplete}
              className={`w-full ${step.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30' : step.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/30' : step.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30'} text-white h-12 text-base font-semibold`}
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
          <Card className="p-6 border-0 shadow-xl bg-[#2A2A2A] border-2 border-emerald-500/50 neuro-glow">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400 mb-2">
                🎉 Triple-Path abgeschlossen!
              </h3>
              <p className="text-white">
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