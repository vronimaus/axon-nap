import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExerciseCoachingPanel({ exercise, rehabPlan, feedbackHistory }) {
  const [variations, setVariations] = useState(null);
  const [adaptedContent, setAdaptedContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const loadVariations = async () => {
    setIsLoading(true);
    setActiveTab('variations');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein erfahrener Reha-Therapeut. Schlage 3 Variationen der folgenden Übung vor.

Übung: ${exercise.name}
Beschreibung: ${exercise.description || ''}
Schwierigkeit: ${exercise.difficulty || ''}
Kategorie: ${exercise.category || ''}
AXON-Moment: ${exercise.axon_moment || ''}

Problem des Nutzers: ${rehabPlan?.problem_summary || ''}

Antworte mit 3 konkreten Variationen: 1x leichter, 1x gleich schwer aber anders, 1x schwerer.`,
        response_json_schema: {
          type: 'object',
          properties: {
            variations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  difficulty: { type: 'string', enum: ['easier', 'similar', 'harder'] },
                  description: { type: 'string' },
                  why: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setVariations(result.variations || []);
    } catch (error) {
      console.error('Error loading variations:', error);
      toast.error('Fehler beim Laden der Variationen');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdaptedCues = async () => {
    setIsLoading(true);
    setActiveTab('cues');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein erfahrener Reha-Coach. Gib personalisierte Coaching-Cues für diese Übung.

Übung: ${exercise.name}
Anleitung: ${exercise.description || ''}
AXON-Moment: ${exercise.axon_moment || ''}
Atemhinweis: ${exercise.breathing_instruction || ''}
Standard-Cues: ${(exercise.cues || []).join(', ')}

Problem des Nutzers: ${rehabPlan?.problem_summary || ''}
Feedback-Historie: ${feedbackHistory?.length ? `${feedbackHistory.length} Einträge` : 'Keine'}

Gib 3-5 präzise, motivierende Cues und eine kurze Erklärung warum diese Übung wichtig ist.`,
        response_json_schema: {
          type: 'object',
          properties: {
            motivation: { type: 'string' },
            adapted_explanation: { type: 'string' },
            cues: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setAdaptedContent(result);
    } catch (error) {
      console.error('Error loading cues:', error);
      toast.error('Fehler beim Laden der Tipps');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={loadVariations}
          disabled={isLoading}
          size="sm"
          className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
        >
          {isLoading && activeTab === 'variations' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Variationen vorschlagen
        </Button>
        <Button
          onClick={loadAdaptedCues}
          disabled={isLoading}
          size="sm"
          className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
        >
          {isLoading && activeTab === 'cues' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4 mr-2" />
          )}
          Adaptive Tipps
        </Button>
      </div>

      <AnimatePresence>
        {variations && activeTab === 'variations' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h6 className="text-sm font-semibold text-purple-400 mb-2">🎯 Personalisierte Variationen</h6>
            {variations.map((variation, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h6 className="font-semibold text-white text-sm">{variation.name}</h6>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    variation.difficulty === 'easier' ? 'bg-green-500/20 text-green-400' :
                    variation.difficulty === 'harder' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {variation.difficulty === 'easier' ? 'Einfacher' :
                     variation.difficulty === 'harder' ? 'Schwerer' : 'Ähnlich'}
                  </span>
                </div>
                <p className="text-slate-300 text-xs mb-2">{variation.description}</p>
                <p className="text-slate-400 text-xs italic">💡 {variation.why}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adaptedContent && activeTab === 'cues' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
          >
            <h6 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Angepasst an dein Problem
            </h6>
            {adaptedContent.motivation && (
              <div className="mb-3 p-2 rounded bg-cyan-500/10">
                <p className="text-cyan-300 text-sm font-medium">{adaptedContent.motivation}</p>
              </div>
            )}
            <p className="text-slate-300 text-sm mb-3 leading-relaxed">{adaptedContent.adapted_explanation}</p>
            {adaptedContent.cues?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 mb-1">Wichtige Cues:</p>
                {adaptedContent.cues.map((cue, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 text-xs">•</span>
                    <p className="text-slate-300 text-xs">{cue}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}