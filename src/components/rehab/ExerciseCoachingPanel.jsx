import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import OuchInterventionModal from './OuchInterventionModal';
import ExerciseDetailCard from './ExerciseDetailCard';

export default function ExerciseCoachingPanel({ exercise, rehabPlan, feedbackHistory, onExerciseSubstituted }) {
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {/* Exercise Detail Card - mit allen Infos strukturiert */}
      <ExerciseDetailCard
        exercise={exercise}
        rehabPlan={rehabPlan}
        feedbackHistory={feedbackHistory}
      />

      {/* Ouch Button - Always Available */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 border-t border-slate-700"
      >
        <Button
          onClick={() => setIsOuchModalOpen(true)}
          className="w-full h-12 bg-gradient-to-r from-red-500/30 to-red-600/30 border border-red-500/40 hover:from-red-500/40 hover:to-red-600/40 text-red-400 hover:text-red-300 gap-2 font-semibold"
        >
          <AlertCircle className="w-5 h-5" />
          Schmerz oder Unwohlsein?
        </Button>
      </motion.div>

      {/* Ouch Intervention Modal */}
      <OuchInterventionModal
        isOpen={isOuchModalOpen}
        onClose={() => setIsOuchModalOpen(false)}
        exerciseId={exercise.exercise_id}
        exerciseName={exercise.name}
        rehabPlanId={rehabPlan.id}
        onExerciseSubstituted={onExerciseSubstituted}
      />
    </div>
  );
}