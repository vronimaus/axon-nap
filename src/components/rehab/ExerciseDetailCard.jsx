import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ExerciseDetailCard({ exercise, rehabPlan, feedbackHistory }) {
  const [expandedSection, setExpandedSection] = useState('overview');
  const [variations, setVariations] = useState(null);
  const [adaptedContent, setAdaptedContent] = useState(null);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [isLoadingCues, setIsLoadingCues] = useState(false);

  const loadVariations = async () => {
    setIsLoadingVariations(true);
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
      setExpandedSection('variations-llm');
    } catch (error) {
      console.error('Error loading variations:', error);
      toast.error('Fehler beim Laden der Variationen');
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const loadAdaptedCues = async () => {
    setIsLoadingCues(true);
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
      setExpandedSection('cues');
    } catch (error) {
      console.error('Error loading cues:', error);
      toast.error('Fehler beim Laden der Tipps');
    } finally {
      setIsLoadingCues(false);
    }
  };

  const SectionButton = ({ icon: Icon, label, sectionId, isLoading, onClick }) => (
    <button
      onClick={() => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
        if (onClick) onClick();
      }}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${
        expandedSection === sectionId
          ? 'bg-cyan-500/20 border border-cyan-500/50'
          : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <ChevronDown
        className={`w-4 h-4 text-slate-400 transition-transform ${
          expandedSection === sectionId ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-3">
      {/* AXON Moment & Basics - Always Visible */}
      <div className="glass rounded-xl p-4 border border-cyan-500/20 space-y-3">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-200">Der AXON-Moment</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {exercise.axon_moment || 'Fokussiere dich auf die richtige Ausführung.'}
          </p>
        </div>

        {exercise.breathing_instruction && (
          <div className="pt-2 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-cyan-400 mb-1.5">💨 Atmung</h4>
            <p className="text-sm text-slate-300">{exercise.breathing_instruction}</p>
          </div>
        )}

        {exercise.cues?.length > 0 && (
          <div className="pt-2 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-cyan-400 mb-1.5">🎯 Standard-Cues</h4>
            <ul className="space-y-1">
              {exercise.cues.slice(0, 3).map((cue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Database Progressions */}
      {(exercise.progression_basic || exercise.progression_advanced) && (
        <div className="glass rounded-xl overflow-hidden border border-slate-700">
          <SectionButton
            icon={Sparkles}
            label="Variationen aus deinem Plan"
            sectionId="variations-db"
          />
          <AnimatePresence>
            {expandedSection === 'variations-db' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-700"
              >
                {exercise.progression_basic && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h5 className="text-xs font-semibold text-green-400 mb-1.5">
                      ✓ Zu intensiv? Versuche das...
                    </h5>
                    <p className="text-sm text-slate-300 mb-2">{exercise.progression_basic.description}</p>
                    <p className="text-xs text-slate-400">
                      <strong>Fokus:</strong> {exercise.progression_basic.focus}
                    </p>
                  </div>
                )}
                {exercise.progression_advanced && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h5 className="text-xs font-semibold text-purple-400 mb-1.5">
                      ⚡ Zu leicht? Versuch das...
                    </h5>
                    <p className="text-sm text-slate-300 mb-2">{exercise.progression_advanced.description}</p>
                    <p className="text-xs text-slate-400">
                      <strong>Fokus:</strong> {exercise.progression_advanced.focus}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AI-Generated Variations */}
      <div className="glass rounded-xl overflow-hidden border border-slate-700">
        <SectionButton
          icon={Sparkles}
          label="Personalisierte KI-Variationen"
          sectionId="variations-llm"
          isLoading={isLoadingVariations}
          onClick={!variations ? loadVariations : null}
        />
        <AnimatePresence>
          {expandedSection === 'variations-llm' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 pt-2 space-y-2 border-t border-slate-700"
            >
              {isLoadingVariations ? (
                <div className="py-6 text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Generiere personalisierte Variationen...</p>
                </div>
              ) : variations?.length > 0 ? (
                variations.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h6 className="text-sm font-semibold text-slate-200">{v.name}</h6>
                      <span
                        className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                          v.difficulty === 'easier'
                            ? 'bg-green-500/20 text-green-400'
                            : v.difficulty === 'harder'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {v.difficulty === 'easier'
                          ? '↓ Leichter'
                          : v.difficulty === 'harder'
                          ? '↑ Schwerer'
                          : '→ Ähnlich'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{v.description}</p>
                    <p className="text-xs text-slate-500 italic">💡 {v.why}</p>
                  </div>
                ))
              ) : (
                <Button
                  onClick={loadVariations}
                  disabled={isLoadingVariations}
                  size="sm"
                  className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                >
                  {isLoadingVariations ? 'Wird generiert...' : 'Variationen generieren'}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Adaptive Coaching Tips */}
      <div className="glass rounded-xl overflow-hidden border border-slate-700">
        <SectionButton
          icon={Lightbulb}
          label="Adaptive Coaching-Tipps"
          sectionId="cues"
          isLoading={isLoadingCues}
          onClick={!adaptedContent ? loadAdaptedCues : null}
        />
        <AnimatePresence>
          {expandedSection === 'cues' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-700"
            >
              {isLoadingCues ? (
                <div className="py-6 text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Personalisiere Coaching-Tipps...</p>
                </div>
              ) : adaptedContent ? (
                <>
                  {adaptedContent.motivation && (
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-sm font-medium text-cyan-300">{adaptedContent.motivation}</p>
                    </div>
                  )}
                  {adaptedContent.adapted_explanation && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {adaptedContent.adapted_explanation}
                    </p>
                  )}
                  {adaptedContent.cues?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-cyan-400">Deine Coaching-Cues:</p>
                      <ul className="space-y-1">
                        {adaptedContent.cues.map((cue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-cyan-400 mt-0.5">✓</span>
                            <span>{cue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={loadAdaptedCues}
                  disabled={isLoadingCues}
                  size="sm"
                  className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                >
                  {isLoadingCues ? 'Wird generiert...' : 'Tipps generieren'}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}