import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { CheckCircle2, Trophy, Zap, MessageSquare, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SessionFeedbackForm({ goalName, onClose, onSaved }) {
  const [reps, setReps] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const user = await base44.auth.me();
      
      // Check if progress entry already exists for this goal
      const existing = await base44.entities.UserPerformanceProgress.filter({
        user_email: user.email,
        goal_code: goalName.toLowerCase().replace(/\s+/g, '_')
      });

      const currentReps = parseInt(reps) || 0;
      const previousMaxReps = existing[0]?.max_reps || 0;
      const newMaxReps = Math.max(currentReps, previousMaxReps);

      const progressData = {
        user_email: user.email,
        goal_code: goalName.toLowerCase().replace(/\s+/g, '_'),
        max_reps: newMaxReps,
        last_intensity: intensity,
        notes: notes,
        last_session_date: new Date().toISOString().split('T')[0],
        total_sessions: existing[0] ? (existing[0].total_sessions || 0) + 1 : 1,
        unlocked: newMaxReps >= 10
      };

      if (existing[0]) {
        await base44.entities.UserPerformanceProgress.update(existing[0].id, progressData);
      } else {
        await base44.entities.UserPerformanceProgress.create(progressData);
      }

      toast.success('Session gespeichert! 🎯');
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const getIntensityLabel = (int) => {
    if (int <= 3) return 'Leicht';
    if (int <= 7) return 'Moderat';
    return 'Intensiv';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl border border-amber-500/30 p-6 max-w-lg w-full relative"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-amber-400">Session abgeschlossen</h2>
          </div>
          <p className="text-sm text-slate-400">
            Wie lief deine Session für <span className="text-amber-400 font-semibold">{goalName}</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reps Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                Geschaffte Wiederholungen
              </label>
            </div>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="z.B. 5"
              min="0"
              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 text-lg"
            />
            <p className="text-xs text-slate-500 mt-2">
              Wie viele saubere Wiederholungen hast du geschafft?
            </p>
          </div>

          {/* Intensity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <Zap className="w-4 h-4 text-purple-400" />
                Session-Intensität
              </label>
              <span className="text-lg font-bold text-purple-400">
                {intensity}/10
                <span className="text-xs text-slate-400 ml-2">{getIntensityLabel(intensity)}</span>
              </span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(v) => setIntensity(v[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              Wie fordernd war die Session für dich?
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <MessageSquare className="w-4 h-4 text-green-400" />
              Notizen & Beobachtungen
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. 'N2 fühlte sich besser an', 'Neuro-Drill war herausfordernd', 'Balance war heute besser'..."
              className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold"
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Zap className="w-5 h-5" />
                </motion.div>
                Speichere...
              </>
            ) : (
              'Fortschritt speichern'
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}