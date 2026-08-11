import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { useAudioCoach } from '@/hooks/useAudioCoach';
import AudioCoachToggle from '@/components/AudioCoachToggle';
import { base44 } from '@/api/base44Client';

export default function IntegrationScreen({
  onComplete,
  screenId = 4,
  nodeId = 'N6',
  improvement = 0,
  tuneUpData = null
}) {
  const [integration, setIntegration] = useState(null);
  const [isLoading, setIsLoading] = useState(!tuneUpData);
  const { isMuted, toggleMute, coach, isPlaying, isLoading: isTTSLoading, stop } = useAudioCoach();

  useEffect(() => {
    // If tuneUpData passed directly, extract integration immediately
    if (tuneUpData) {
      const intg = tuneUpData.integration ?? null;
      if (intg) {
        setIntegration({
          technicalName: intg['primär_bewegung'] || intg.primär_bewegung || '',
          reps: intg['wiederholungen'] || intg.wiederholungen || '',
          tweak1: intg['tweak_1'] || intg.tweak_1 || '',
          tweak2: intg['tweak_2'] || intg.tweak_2 || '',
        });
      }
      setIsLoading(false);
      return;
    }
    const fetchIntegration = async () => {
      setIsLoading(true);
      try {
        const results = await base44.entities.TuneUpCausalChain.filter({ node_id: nodeId });
        if (results.length > 0) {
          const r = results[0];
          const intg = r.data?.integration ?? r.integration ?? null;
          if (intg) {
            setIntegration({
              technicalName: intg['primär_bewegung'] || intg.primär_bewegung || '',
              reps: intg['wiederholungen'] || intg.wiederholungen || '',
              tweak1: intg['tweak_1'] || intg.tweak_1 || '',
              tweak2: intg['tweak_2'] || intg.tweak_2 || '',
            });
          }
        }
      } catch (e) {
        console.error('IntegrationScreen fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIntegration();
  }, [nodeId, tuneUpData]);

  const handlePlayAudio = () => {
    if (isPlaying) { stop(); return; }
    if (!integration) return;
    const text = [
      'Deine Integrationsübung.',
      integration.reps,
      integration.tweak1,
      integration.tweak2,
      'Das ist die neuronale Verankerung. Dein Gehirn myelinisiert die neuen Bewegungsmuster, wenn du sie sofort nach dem MFR und Neuro-Training nutzt.'
    ].filter(Boolean).join(' ');
    coach(text);
  };

  // Auto-play when integration data loads
  useEffect(() => {
    if (!integration) return;
    const text = [
      'Deine Integrationsübung.',
      integration.reps,
      integration.tweak1,
      integration.tweak2,
      'Das ist die neuronale Verankerung. Dein Gehirn myelinisiert die neuen Bewegungsmuster, wenn du sie sofort nach dem MFR und Neuro-Training nutzt.'
    ].filter(Boolean).join(' ');
    const timer = setTimeout(() => coach(text), 300);
    return () => clearTimeout(timer);
  }, [integration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = () => {
    onComplete(screenId, { nodeId, integrationCompleted: true });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="w-full max-w-sm mx-auto text-center text-slate-400 py-10">
        Keine Integrations-Daten für diesen Node gefunden.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-5"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-transparent p-5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">Easy Strength</p>
        <h3 className="text-xl font-black text-white mt-0.5">Finale Integration</h3>
        <p className="text-xs text-slate-400 mt-1">Verankere die neue Bewegungsfreiheit neurologisch</p>
        <p className="text-[10px] text-slate-600 mt-1 font-mono">{integration.technicalName}</p>
      </motion.div>

      {/* Improvement Badge */}
      {improvement > 0 && (
        <motion.div
          animate={{ scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="glass rounded-2xl border-2 border-emerald-500/60 p-4 text-center shadow-[0_0_20px_rgba(52,211,153,0.25)]"
        >
          <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold mb-1">Verbesserung</p>
          <p className="text-3xl font-black text-emerald-400">-{improvement} Punkte</p>
        </motion.div>
      )}

      {/* Exercise Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl border border-purple-500/40 p-5 space-y-4 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
      >
        {/* Ausführung */}
        {integration.reps && (
          <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">🎯</span>
            <div>
              <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">Ausführung</p>
              <p className="text-slate-200 text-sm leading-relaxed">{integration.reps}</p>
            </div>
          </div>
        )}

        {/* Tweaks */}
        {(integration.tweak1 || integration.tweak2) && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wenn es noch schwer fällt</p>
            {integration.tweak1 && (
              <div className="flex items-start gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-purple-400 font-bold text-sm mt-0.5">→</span>
                <span className="text-xs text-slate-300 leading-relaxed">{integration.tweak1}</span>
              </div>
            )}
            {integration.tweak2 && (
              <div className="flex items-start gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
                <span className="text-purple-400 font-bold text-sm mt-0.5">→</span>
                <span className="text-xs text-slate-300 leading-relaxed">{integration.tweak2}</span>
              </div>
            )}
          </div>
        )}

        {/* Warum */}
        <div className="border-t border-purple-500/20 pt-3">
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-1">🧠 Warum das funktioniert</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Das ist die neuronale Verankerung. Dein Gehirn myelinisiert die neuen Bewegungsmuster, wenn du sie sofort nach dem MFR und Neuro-Training nutzt.
          </p>
        </div>
      </motion.div>

      {/* Audio Coach Toggle + Replay */}
      <AudioCoachToggle isMuted={isMuted} onToggle={toggleMute} isLoading={isTTSLoading} isPlaying={isPlaying} />
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-medium border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all active:scale-95"
      >
        {isTTSLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Lädt…</>
          : <><Volume2 className="w-4 h-4" /> {isPlaying ? 'Stoppen' : 'Wiederholen'}</>
        }
      </button>

      <Button
        onClick={handleComplete}
        className="w-full h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-purple-500/40 active:scale-95 transition-transform"
      >
        Fertig ✓
      </Button>
    </motion.div>
  );
}