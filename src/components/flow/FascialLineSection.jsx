import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Activity, Brain, Check, ChevronRight, Layers, RotateCw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const MAIN_CHAIN_CODES = ['SBL', 'SFL', 'LL', 'SPL', 'DFL', 'FL'];

export default function FascialLineSection({ routines, onNavigateToRoutine }) {
  const [selectedChain, setSelectedChain] = useState(null);
  const navigate = useNavigate();

  const { data: chains = [], isLoading } = useQuery({
    queryKey: ['fascialChains'],
    queryFn: () => base44.entities.FascialChain.list(),
  });

  const { data: mfrNodes = [] } = useQuery({
    queryKey: ['mfrNodesForChains'],
    queryFn: () => base44.entities.MFRNode.list(),
  });

  const mainChains = useMemo(() => {
    return MAIN_CHAIN_CODES
      .map(code => chains.find(c => c.code === code))
      .filter(Boolean);
  }, [chains]);

  // Match routines to a chain by body_regions overlap
  const getMatchingRoutines = (chain) => {
    if (!chain?.body_regions || !routines) return [];
    const chainRegions = chain.body_regions;
    return routines.filter(r => {
      if (!r.sequence) return false;
      // Check if any exercise in the routine has a node_id matching this chain's regions
      const nodeIds = r.sequence.filter(s => s.node_id).map(s => s.node_id);
      if (nodeIds.length === 0) {
        // Fallback: match by routine category or description keywords
        const desc = (r.routine_name + ' ' + (r.description || '')).toLowerCase();
        return chainRegions.some(region => desc.includes(region.replace('_', ' ')));
      }
      // Match MFR nodes to chain by position/body_area overlap
      const matchingNodes = nodeIds.some(nid => {
        const node = mfrNodes.find(n => n.node_id === nid);
        if (!node) return false;
        const nodePos = node.position || '';
        const nodeArea = (node.body_area || '').toLowerCase();
        // SBL = back, SFL/DFL = front, LL = side
        if (chain.code === 'SBL') return nodePos === 'back';
        if (chain.code === 'SFL' || chain.code === 'DFL') return nodePos === 'front';
        if (chain.code === 'LL') return nodePos === 'side' || nodeArea.includes('lateral') || nodeArea.includes('seite');
        if (chain.code === 'SPL') return nodeArea.includes('rotation') || nodeArea.includes('rotat') || nodePos === 'side';
        if (chain.code === 'FL') return true; // functional = whole body
        return false;
      });
      return matchingNodes;
    }).slice(0, 3);
  };

  const startChainFlow = (chain) => {
    // Build a dynamic routine from the FascialChain data
    const sequence = [
      {
        type: 'mobility',
        exercise_name: `Pre-Test: ${chain.test_name}`,
        exercise_description: chain.test_instruction,
        instruction: chain.test_instruction,
        axon_moment: 'Merke dir genau, wo die Spannung sitzt — nach dem Flow wirst du sie wieder testen.',
        duration_seconds: 60,
        phase: '1. Test',
        module_name: chain.name_de,
      },
      {
        type: 'mfr',
        exercise_name: `MFR: ${chain.name_de}`,
        exercise_description: `Löse die myofaszialen Strukturen entlang der ${chain.name_de}. Nutze einen Lacrosse-Ball oder die Schaumrolle an den Engpässen dieser Linie.`,
        instruction: `Fokusiere dich auf die Körperregionen: ${chain.body_regions?.join(', ')}. Halte jeden Punkt 60-90 Sekunden bei tiefem Atem.`,
        axon_moment: 'Die Faszie reagiert auf anhaltenden, sanften Druck — nicht auf Gewalt. Atme in den Druck hinein.',
        duration_seconds: 120,
        phase: '2. MFR Release',
        module_name: chain.name_de,
      },
      {
        type: 'neuro',
        exercise_name: `Neuro-Drill: ${chain.neuro_marker}`,
        exercise_description: chain.neuro_instruction,
        instruction: chain.neuro_instruction,
        axon_moment: 'Dieser Drill kalibriert dein Nervensystem auf die neue Bewegungsfreiheit.',
        duration_seconds: 60,
        phase: '3. Neuro-Drill',
        module_name: chain.name_de,
      },
      {
        type: 'mobility',
        exercise_name: `Re-Test: ${chain.test_name}`,
        exercise_description: `Wiederhole den Test: ${chain.test_instruction}`,
        instruction: `Vergleiche das Ergebnis mit deinem Pre-Test. Wo spürst du eine Veränderung?`,
        axon_moment: 'Die Verbesserung ist neuronal verankert — dein Nervensystem hat die neue Freiheit integriert.',
        duration_seconds: 60,
        phase: '4. Re-Test',
        module_name: chain.name_de,
      },
    ];

    const dynamicRoutine = {
      routine_name: `${chain.name_de} Flow`,
      description: chain.description,
      total_duration: 5,
      total_duration_seconds: 300,
      category: 'faszien',
      difficulty: 'easy',
      intensity_level: 'low',
      sequence,
      completion_title: `${chain.name_de} aktiviert ✓`,
      completion_message: `Du hast die ${chain.name_de} getestet, gelöst und neu kalibriert. Wiederhole diesen Flow 2-3x pro Woche für nachhaltige Geschmeidigkeit.`,
      expert_explanation: chain.description,
    };

    navigate(createPageUrl('Flow'), { state: { routine: dynamicRoutine } });
  };

  if (isLoading || mainChains.length === 0) return null;

  return (
    <>
      {/* Chain Cards Grid */}
      <section>
        <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
          Faszienlinien pflegen
        </h2>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Jede myofasziale Linie durchzieht deinen Körper wie ein Netzwerk. Pflege sie gezielt — für geschmeidige Bewegung und widerstandsfähige Struktur.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {mainChains.map((chain, idx) => (
            <motion.button
              key={chain.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedChain(chain)}
              className="text-left rounded-xl border border-white/[0.06] bg-zinc-900/60 hover:border-white/[0.12] transition-all p-3.5 group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: chain.color }}
                />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{chain.code}</span>
              </div>
              <h3 className="text-xs font-semibold text-zinc-200 leading-tight mb-1">
                {chain.name_de}
              </h3>
              <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                {chain.description}
              </p>
              <div className="flex items-center gap-1 mt-2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <span className="text-[9px] font-medium uppercase tracking-wider">Testen</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Chain Detail Modal */}
      <AnimatePresence>
        {selectedChain && (
          <ChainDetailModal
            chain={selectedChain}
            matchingRoutines={getMatchingRoutines(selectedChain)}
            onClose={() => setSelectedChain(null)}
            onStartFlow={() => { startChainFlow(selectedChain); setSelectedChain(null); }}
            onNavigateToRoutine={onNavigateToRoutine}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ChainDetailModal({ chain, matchingRoutines, onClose, onStartFlow, onNavigateToRoutine }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.color }} />
            <div>
              <h2 className="text-sm font-bold text-white">{chain.name_de}</h2>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{chain.code} · {chain.name_en}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Description */}
          <p className="text-sm text-zinc-300 leading-relaxed">{chain.description}</p>

          {/* Body Regions */}
          <div className="flex flex-wrap gap-1.5">
            {chain.body_regions?.map(region => (
              <span key={region} className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                {region.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          {/* Test */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Pre-Test</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{chain.test_name}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{chain.test_instruction}</p>
            {chain.test_positive_indicator && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Eingeschränkt wenn:</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{chain.test_positive_indicator}</p>
              </div>
            )}
          </div>

          {/* Neuro Drill */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Neuro-Drill</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{chain.neuro_marker}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{chain.neuro_instruction}</p>
          </div>

          {/* Start Flow Button */}
          <button
            onClick={onStartFlow}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCw className="w-4 h-4" />
            Faszienlinien-Flow starten
          </button>

          {/* Matching Routines */}
          {matchingRoutines.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Tiefer gehen — passende Routinen</span>
              </div>
              <div className="space-y-2">
                {matchingRoutines.map(routine => (
                  <button
                    key={routine.id}
                    onClick={() => onNavigateToRoutine(routine)}
                    className="w-full text-left rounded-xl border border-white/[0.06] bg-zinc-900/60 hover:border-white/[0.12] p-3 transition-all group flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">{routine.routine_name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{routine.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}