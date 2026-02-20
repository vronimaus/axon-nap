import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap } from 'lucide-react';
import OuchInterventionModal from './OuchInterventionModal';
import ExerciseDetailCard from './ExerciseDetailCard';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExerciseCoachingPanel({ exercise, rehabPlan, feedbackHistory, onExerciseSubstituted }) {
  const [isOuchModalOpen, setIsOuchModalOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handlePerformanceBoost = async () => {
    setIsUpgrading(true);
    try {
      const { data } = await base44.functions.invoke('performanceBoost', {
        rehabPlanId: rehabPlan.id,
        exerciseId: exercise.exercise_id,
        currentPhaseIndex: (rehabPlan.current_phase || 1) - 1
      });

      if (data.blocked) {
        toast.error(data.reason || 'Upgrade nicht möglich');
      } else if (data.success) {
        toast.success(data.message || '🚀 Übung upgraded!', { duration: 5000 });
        if (onExerciseSubstituted) onExerciseSubstituted();
      }
    } catch (error) {
      console.error('Performance boost error:', error);
      toast.error('Fehler beim Upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Exercise Detail Card */}
      <ExerciseDetailCard
        exercise={exercise}
        rehabPlan={rehabPlan}
        feedbackHistory={feedbackHistory}
      />

      {/* Feedback Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 border-t border-slate-700 space-y-3"
      >
        {/* Performance Boost Button - Only if next_progression_id exists */}
        {exercise.next_progression_id && (
          <Button
            onClick={handlePerformanceBoost}
            disabled={isUpgrading}
            className="w-full h-12 bg-gradient-to-r from-green-500/30 to-cyan-500/30 border border-green-500/40 hover:from-green-500/40 hover:to-cyan-500/40 text-green-400 hover:text-green-300 gap-2 font-semibold"
          >
            <Zap className="w-5 h-5" />
            {isUpgrading ? 'Lädt...' : 'Fühle mich großartig! 🚀'}
          </Button>
        )}

        {/* Ouch Button */}
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