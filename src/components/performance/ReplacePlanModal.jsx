import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Target, ArrowRight } from 'lucide-react';

export default function ReplacePlanModal({ existingPlan, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass rounded-2xl border border-amber-500/30 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-b border-amber-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-amber-400">Bestehender Trainingsplan gefunden</h2>
          </div>
          <p className="text-sm text-slate-300">
            Du hast bereits einen aktiven Trainingsplan. Was möchtest du tun?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Existing Plan Info */}
          <div className="glass rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-cyan-400 mb-1">Aktueller Plan</h3>
                <p className="text-sm text-slate-300">{existingPlan.goal_description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Phase {existingPlan.current_phase} von {existingPlan.phases?.length || 3}
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Button
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white h-auto py-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-semibold">Neuen Plan erstellen</div>
                  <div className="text-xs opacity-90">Bestehenden Plan archivieren und neuen Plan starten</div>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0 ml-3" />
              </div>
            </Button>

            <Button
              onClick={onCancel}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 h-auto py-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-semibold">Bestehenden Plan behalten</div>
                  <div className="text-xs opacity-75">Zurück zum Dashboard (Plan im Tab TRAINING anpassen)</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}