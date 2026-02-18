import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RehabCoachingPanel({ 
  exerciseId, 
  nrsScore, 
  recentSessions,
  onProgramUpdate,
  isLoading = false 
}) {
  const [coachingData, setCoachingData] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!exerciseId || nrsScore === undefined) return;

    const fetchCoachingData = async () => {
      try {
        const response = await base44.functions.invoke('rehabCoach', {
          current_exercise_id: exerciseId,
          nrs_score: nrsScore,
          hardware_score: 7,
          software_score: 7,
          battery_score: 7,
          recent_sessions: recentSessions || [],
          current_plan_id: null
        });

        if (response.data?.success) {
          setCoachingData(response.data);
          setError(null);

          // Call parent callback with updated program
          if (onProgramUpdate) {
            onProgramUpdate(response.data);
          }
        } else {
          setError('Coaching-Logik konnte nicht berechnet werden');
        }
      } catch (err) {
        console.error('RehabCoachingPanel error:', err);
        setError('Fehler beim Abrufen der Coaching-Empfehlung');
      }
    };

    fetchCoachingData();
  }, [exerciseId, nrsScore]);

  if (isLoading || !coachingData) {
    return null;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
      >
        <p className="text-red-300 text-sm">{error}</p>
      </motion.div>
    );
  }

  const { ris_status, safety_flare_triggered, recommended_action, coaching_message, next_exercise, use_hybrid_bridge } = coachingData;

  // Determine styling based on RIS status
  const statusConfig = {
    STUCK: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-300',
      icon: AlertTriangle,
      label: '🔴 STUCK'
    },
    TESTING: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      icon: Zap,
      label: '🟡 TESTING'
    },
    READY: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-300',
      icon: CheckCircle2,
      label: '🟢 READY'
    }
  };

  const config = statusConfig[ris_status] || statusConfig.STUCK;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${config.bg} border ${config.border} rounded-xl overflow-hidden mb-6`}
      >
        {/* Header - Always Visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start gap-3 p-4 hover:bg-white/5 transition-colors"
        >
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
          
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-sm ${config.text}`}>
                {config.label} {ris_status} Status
              </span>
              {safety_flare_triggered && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                  ⚠️ Safety Flare
                </span>
              )}
              {use_hybrid_bridge && (
                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  🌉 Hybrid-Bridge
                </span>
              )}
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {coaching_message}
            </p>
          </div>

          <span className={`text-xs font-bold ${config.text} flex-shrink-0`}>
            {expanded ? '▼' : '▶'}
          </span>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10 px-4 py-4 space-y-4"
            >
              {/* Recommended Action */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">Empfohlene Aktion:</p>
                <p className={`text-sm font-bold ${config.text} capitalize`}>
                  {recommended_action === 'regression' && '📉 Regression (Pain Override)'}
                  {recommended_action === 'hybrid_bridge' && '🌉 Hybrid-Bridge (Preparation)'}
                  {recommended_action === 'progression' && '📈 Progression (Ready!)'}
                  {recommended_action === 'hold' && '➡️ Hold Current Level'}
                </p>
              </div>

              {/* Next Exercise Details */}
              {next_exercise && (
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Nächste Übung:</p>
                  <div className={`${config.bg} border ${config.border} rounded-lg p-3`}>
                    <h4 className="text-sm font-bold text-slate-200 mb-1">{next_exercise.name}</h4>
                    <p className="text-xs text-slate-300 mb-2">{next_exercise.description}</p>
                    <p className="text-xs text-slate-400">
                      <span className="font-bold">Fokus:</span> {next_exercise.focus}
                    </p>
                    {next_exercise.reason && (
                      <p className="text-xs text-slate-400 mt-2 italic">{next_exercise.reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Session Structure Recommendation */}
              {coachingData.session_structure && (
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Session-Struktur:</p>
                  <div className="space-y-2">
                    <div className="text-xs bg-white/5 rounded-lg p-2 border border-white/10">
                      <p className="font-bold text-cyan-300">Phase 1: Primer (5 min)</p>
                      <p className="text-slate-300">{coachingData.session_structure.phase_1_primer.description}</p>
                    </div>
                    <div className="text-xs bg-white/5 rounded-lg p-2 border border-white/10">
                      <p className="font-bold text-purple-300">Phase 2: Engine (20 min)</p>
                      <p className="text-slate-300">
                        {coachingData.session_structure.phase_2_engine.sets_reps?.sets}x{coachingData.session_structure.phase_2_engine.sets_reps?.reps} @ {coachingData.session_structure.phase_2_engine.sets_reps?.tempo}
                        ({coachingData.session_structure.phase_2_engine.sets_reps?.intensity})
                      </p>
                    </div>
                    <div className="text-xs bg-white/5 rounded-lg p-2 border border-white/10">
                      <p className="font-bold text-green-300">Phase 3: Reset (5 min)</p>
                      <p className="text-slate-300">{coachingData.session_structure.phase_3_reset.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Golden Rules Explanation */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">Was dahintersteckt:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>✓ <span className="font-bold">Rule #2 (Bio-Feedback Override):</span> NRS entscheidet, nicht dein Ego</li>
                  <li>✓ <span className="font-bold">Rule #5 (3-Session Constancy):</span> Erst nach 3 guten Sessions progression</li>
                  <li>✓ <span className="font-bold">Rule #1 (3-Phase Structure):</span> Immer Primer → Engine → Reset</li>
                  <li>✓ <span className="font-bold">Rule #6 (Safety Flare):</span> Schmerz > Ego. Immer.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}