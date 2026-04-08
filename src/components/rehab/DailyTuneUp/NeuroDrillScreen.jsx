import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Check } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { base44 } from '@/api/base44Client';

export default function NeuroDrillScreen({ onComplete, screenId = 1, nodeId = 'N6' }) {
  const [drillData, setDrillData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const { isPlaying, isLoading: isTTSLoading, playText, stop } = useTTS();

  useEffect(() => {
    const fetchDrill = async () => {
      setIsLoading(true);
      try {
        const results = await base44.entities.TuneUpCausalChain.filter({ node_id: nodeId });
        if (results.length > 0) {
          const r = results[0];
          // SDK wraps entity fields under .data — software_update lives at r.data.software_update
          const sw = r.data?.software_update ?? r.software_update ?? null;
          setDrillData(sw);
        }
      } catch (e) {
        console.error('NeuroDrillScreen fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDrill();
  }, [nodeId]);

  const handlePlayAudio = () => {
    if (isPlaying) { stop(); return; }
    if (!drillData) return;
    const text = `${drillData['übung']}. ${drillData['ausführung']}. ${drillData['warum'] || ''}`;
    playText(text);
  };

  const handleComplete = () => {
    onComplete(screenId, { nodeId, neuroDrillsCompleted: true });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!drillData) {
    return (
      <div className="w-full max-w-sm mx-auto text-center text-slate-400 py-10">
        Keine Daten für diesen Node gefunden.
      </div>
    );
  }

  const drillName = drillData['übung'] || drillData.übung || '';
  const drillInstruction = drillData['ausführung'] || drillData.ausführung || '';
  const drillWhy = drillData['warum'] || drillData.warum || '';
  const drillGoal = drillData['neurologisches_ziel'] || drillData.neurologisches_ziel || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm mx-auto px-4 space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-transparent p-5"
      >
        <p className="text-slate-200 text-sm leading-relaxed font-medium">
          <span className="text-cyan-400 font-bold">Neuro-Drill</span> für Node {nodeId}
        </p>
      </motion.div>

      {/* Drill Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 p-5 space-y-3"
      >
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Software-Update</p>
        <h3 className="text-lg font-black text-white">{drillName}</h3>
        <p className="text-slate-300 text-xs leading-relaxed">{drillInstruction}</p>

        {drillGoal && (
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Neurologisches Ziel</p>
            <p className="text-slate-400 text-xs leading-relaxed">{drillGoal}</p>
          </div>
        )}

        {drillWhy && (
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Warum das hilft</p>
            <p className="text-slate-500 text-xs leading-relaxed">{drillWhy}</p>
          </div>
        )}
      </motion.div>

      {/* Audio Button */}
      <button
        onClick={handlePlayAudio}
        disabled={isTTSLoading}
        className={`w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
          isPlaying
            ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/40'
        }`}
      >
        {isTTSLoading
          ? <><Loader2 className="w-6 h-6 animate-spin" /> Wird geladen…</>
          : isPlaying
          ? <><VolumeX className="w-6 h-6" /> Stoppen</>
          : <><Volume2 className="w-6 h-6" /> Audio-Anleitung</>
        }
      </button>

      {isPlaying && (
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 h-6 bg-cyan-400 rounded-full"
            />
          ))}
          <span className="text-xs text-cyan-400 ml-2 font-medium">Coach führt dich…</span>
        </div>
      )}

      {/* Complete Button */}
      {!drillCompleted ? (
        <Button
          onClick={() => {
            setDrillCompleted(true);
          }}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/40 active:scale-95 transition-transform"
        >
          Fertig ✓
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={handleComplete}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
          >
            <Check className="w-4 h-4" />
            Weiter →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}