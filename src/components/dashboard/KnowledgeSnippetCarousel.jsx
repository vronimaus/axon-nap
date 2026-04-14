import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

export default function KnowledgeSnippetCarousel({ activeRehabPlan }) {
  const [selectedSnippetId, setSelectedSnippetId] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});

  // Get node ID from problem summary
  const getNodeIdFromProblem = (problemSummary) => {
    if (!problemSummary) return null;
    const s = problemSummary.toLowerCase();
    if (s.includes('nacken') || s.includes('hals')) return 'N1';
    if (s.includes('schulter') || s.includes('arm')) return 'N2';
    if (s.includes('brust') || s.includes('brustkorb')) return 'N3';
    if (s.includes('rücken') || s.includes('wirbel') || s.includes('dorsal')) return 'N4';
    if (s.includes('lenden') || s.includes('lendenwirbel')) return 'N5';
    if (s.includes('knie')) return 'N6';
    if (s.includes('hüfte') || s.includes('becken')) return 'N7';
    if (s.includes('fuss') || s.includes('knöchel') || s.includes('fersen')) return 'N8';
    if (s.includes('wade') || s.includes('waden')) return 'N9';
    if (s.includes('ellbogen') || s.includes('unterarm')) return 'N10';
    if (s.includes('hand') || s.includes('finger')) return 'N11';
    if (s.includes('kopf') || s.includes('kiefer') || s.includes('atem')) return 'N12';
    return null;
  };

  const nodeId = getNodeIdFromProblem(activeRehabPlan?.problem_summary);

  // Fetch snippets for this node
  const { data: snippets = [], isLoading } = useQuery({
    queryKey: ['snippetsForNode', nodeId],
    queryFn: async () => {
      if (!nodeId) return [];
      const res = await base44.entities.KnowledgeSnippet.filter({ node_id: nodeId, is_active: true }, '-created_date', 10);
      return res || [];
    },
    enabled: !!nodeId,
    staleTime: 10 * 60 * 1000,
  });

  const selectedSnippet = snippets.find(s => s.id === selectedSnippetId) || snippets[0];

  if (isLoading) {
    return (
      <div className="space-y-2 text-center py-4">
        <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse mx-auto" />
        <p className="text-xs text-zinc-600">Lade Wissen…</p>
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-zinc-600">
        Keine Snippets für diese Region verfügbar
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Snippet Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSnippet?.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-white/[0.06] bg-zinc-800/40 p-3"
        >
          {/* Image */}
          {selectedSnippet?.image_url && (
            <img
              src={selectedSnippet.image_url}
              alt={selectedSnippet.title}
              className="w-full h-32 rounded-lg object-cover mb-2"
            />
          )}

          {/* Title */}
          <h3 className="text-xs font-bold text-zinc-200 mb-1">{selectedSnippet?.title}</h3>

          {/* Summary */}
          <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">
            {selectedSnippet?.summary || selectedSnippet?.content?.slice(0, 120)}
          </p>

          {/* Category Badge */}
          {selectedSnippet?.category && (
            <div className="mt-2">
              <span className="inline-block text-[9px] uppercase tracking-widest text-zinc-500 border border-white/[0.06] px-2 py-1 rounded">
                {selectedSnippet.category}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Carousel Navigation */}
      {snippets.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentIdx = snippets.findIndex(s => s.id === selectedSnippet?.id);
              const prevIdx = (currentIdx - 1 + snippets.length) % snippets.length;
              setSelectedSnippetId(snippets[prevIdx].id);
            }}
            className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 border border-white/[0.06] transition-colors"
          >
            <ChevronLeft className="w-3 h-3 text-zinc-400" />
          </button>

          {/* Dot indicators */}
          <div className="flex-1 flex justify-center gap-1">
            {snippets.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedSnippetId(s.id)}
                className={`h-1.5 rounded-full transition-all ${
                  selectedSnippet?.id === s.id
                    ? 'bg-zinc-400 w-4'
                    : 'bg-zinc-700 w-1.5 hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const currentIdx = snippets.findIndex(s => s.id === selectedSnippet?.id);
              const nextIdx = (currentIdx + 1) % snippets.length;
              setSelectedSnippetId(snippets[nextIdx].id);
            }}
            className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 border border-white/[0.06] transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </button>
        </div>
      )}

      {/* Knowledge Test Section */}
      {selectedSnippet?.content && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/[0.06] bg-zinc-800/40 p-3 space-y-3"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Wissenstest</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{selectedSnippet.content}</p>
          </div>

          {/* Simple True/False Test */}
          <div className="flex gap-2">
            <button
              onClick={() => setTestAnswers(prev => ({ ...prev, [selectedSnippet.id]: true }))}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-all ${
                testAnswers[selectedSnippet.id] === true
                  ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-800/50 border border-white/[0.06] text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Verstanden
            </button>
            <button
              onClick={() => setTestAnswers(prev => ({ ...prev, [selectedSnippet.id]: false }))}
              className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-all ${
                testAnswers[selectedSnippet.id] === false
                  ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                  : 'bg-zinc-800/50 border border-white/[0.06] text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Circle className="w-3 h-3" />
              Wiederholen
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}