import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

export default function SymptomAnalyzer({ onAnalysisComplete }) {
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeSymptom = async () => {
    if (!description.trim()) return;
    
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Experte für Faszialketten nach Thomas Myers und Z-Health Neuro-Athletik.

AUFGABE: Analysiere die Symptombeschreibung mit detektivischem Reasoning in 6 Schritten:

SCHRITT 1 - EXTRAKTION DER VARIABLEN:
- Region: Wo tritt der Schmerz auf? (z.B. Nacken, Schulter, Rhomboideen, LWS, Hüfte)
- Trigger-Position: Was verschlimmert es? (z.B. "Liegen auf der linken Seite", "Sitzen", "Kopf nach links")
- Relief-Position: Was verbessert es? (z.B. "Kopf nach rechts drehen", "Aufstehen", "Bein anwinkeln")
- Seite: Links, rechts oder beidseitig?
- Auftrittskontext: Stehen/Gehen oder Liegen/Sitzen?

SCHRITT 2 - HIERARCHISCHE FILTER (PRE-SCREENING):
FILTER A (Fundament): Tritt Schmerz beim Stehen/Gehen auf? → Flag "needs_foot_check" = true
FILTER B (Sicherheit): Gibt es Hinweise auf Stress/hohes Schmerzniveau? → Flag "needs_breath_work" = true

SCHRITT 3 - REASONING-ENGINE (Differential-Fragen):

A. NACKEN & SCHULTER:
- Tritt Schmerz bei Drehung auf? → Spirallinie (SPL), Augen-Fokus
- Tritt Schmerz bei Neigung auf? → Laterallinie (LL), Gleichgewicht
- Blockiert Blick nach hinten? → Teste Kiefer-Vorschub (Trigeminus vs. SFL)

B. RÜCKEN & LWS:
- Schmerz bei Vorbeuge? → SBL (Hardware/Spannung)
- Schmerz bei Rückbeuge? → SFL/DFL (Software-Schutz/Hüftbeuger)

C. KNIE & HÜFTE:
- Schmerz beim Treppensteigen aufwärts? → SFL (Kraft/Zug)
- Schmerz beim Treppensteigen abwärts? → SBL (Stabilität/Hüfte)

SCHRITT 4 - ANATOMISCHE INTERPRETATION (LOGIK-REGELN):
- Kompression schmerzt → Priorisiere Laterallinie (LL) + Nervendynamik
- Schmerz diagonal → Spirallinie (SPL)
- Kopfdrehung zur GEGENSEITE hilft → Software-Schutz (70%+)
- Bewegungsabhängig → Hardware-Tests
- Positionsabhängig → Software-Wahrscheinlichkeit höher

SCHRITT 5 - DYNAMISCHE HYPOTHESE:
Formuliere in 2-3 Sätzen: "Dein Gehirn schützt aktuell [Region]. Wir testen, ob es ein strukturelles (Hardware) oder neuronales (Software) Sicherheitsproblem ist."

SCHRITT 6 - SAFETY CHECK (RED FLAGS):
Warnsignale: Taubheit, Kribbeln, Kraftverlust, Schwindel mit Sehstörungen, ausstrahlende Schmerzen.

Symptombeschreibung:
"${description}"

Führe alle 6 Schritte durch und gib eine präzise, detektivische Analyse.`,
        response_json_schema: {
          type: "object",
          properties: {
            step1_extraction: {
              type: "object",
              properties: {
                region: { type: "string" },
                trigger_position: { type: "string" },
                relief_position: { type: "string" },
                side: { type: "string", enum: ["links", "rechts", "beidseitig"] },
                context: { type: "string", enum: ["stehen_gehen", "liegen_sitzen", "gemischt"] }
              }
            },
            step2_filters: {
              type: "object",
              properties: {
                needs_foot_check: { type: "boolean", description: "Schmerz beim Stehen/Gehen?" },
                needs_breath_work: { type: "boolean", description: "Stress/hohes Schmerzniveau?" },
                filter_reasoning: { type: "string" }
              }
            },
            step3_reasoning: {
              type: "object",
              properties: {
                differential_questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      interpretation: { type: "string" }
                    }
                  }
                },
                pattern_detected: { type: "string", description: "Drehung/Neigung/Vorbeuge/etc." }
              }
            },
            step4_interpretation: {
              type: "object",
              properties: {
                compression_detected: { type: "boolean" },
                diagonal_pain: { type: "boolean" },
                head_rotation_relief: { type: "boolean" },
                movement_dependent: { type: "boolean" },
                position_dependent: { type: "boolean" }
              }
            },
            step5_hypothesis: {
              type: "string",
              description: "User-friendly Erklärung mit Gehirn-Schutz-Kontext"
            },
            step6_red_flags: {
              type: "object",
              properties: {
                flags_detected: { type: "boolean" },
                warning_message: { type: "string" },
                specific_flags: { type: "array", items: { type: "string" } }
              }
            },
            test_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  chain_code: { type: "string" },
                  test_type: { type: "string", enum: ["hardware", "software"] },
                  test_name: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            primary_chains: {
              type: "array",
              items: { type: "string" }
            },
            secondary_chains: {
              type: "array",
              items: { type: "string" }
            },
            hardware_probability: { type: "number" },
            software_probability: { type: "number" },
            test_strategy: {
              type: "string",
              enum: ["software_first", "hardware_first", "mixed"]
            }
          },
          required: ["step5_hypothesis", "test_recommendations", "step6_red_flags", "primary_chains", "hardware_probability", "software_probability"]
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error('Analyse-Fehler:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (analysis) {
      onAnalysisComplete({
        description,
        analysis,
        testedChains: [...analysis.primary_chains, ...(analysis.secondary_chains || [])]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-cyan rounded-2xl p-6 border border-cyan-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-cyan-400">KI-Symptomanalyse</h3>
            <p className="text-xs text-slate-400">Beschreibe deine Symptome im Detail</p>
          </div>
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beispiel: Ich habe Schmerzen im Nacken und Schulterbereich, die in die Rhomboideen ziehen, wenn ich auf meiner linken Rückseite liege. Gewicht eher links mit dem Kopf auf dem Kopfkissen. Wenn ich den Kopf nach rechts lege, sind die Schmerzen fast weg."
          className="min-h-[120px] bg-slate-900/50 border-cyan-500/30 text-slate-200 placeholder:text-slate-500"
          disabled={analyzing}
        />

        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-400">
            💡 <span className="font-semibold text-cyan-400">Tipp:</span> Beschreibe:
          </p>
          <ul className="text-xs text-slate-500 space-y-1 ml-4">
            <li>• Wo genau tut es weh?</li>
            <li>• In welcher Position/Bewegung tritt es auf?</li>
            <li>• Was macht es besser/schlimmer?</li>
            <li>• Strahlt der Schmerz aus?</li>
          </ul>
        </div>

        <Button
          onClick={analyzeSymptom}
          disabled={!description.trim() || analyzing}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold touch-target neuro-glow"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Symptome analysieren
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Red Flags Warning */}
          {analysis.step6_red_flags?.flags_detected && (
            <div className="glass rounded-2xl p-6 border-2 border-red-500/50 bg-red-500/10">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                ⚠️ Warnsignale erkannt
              </h4>
              <p className="text-sm text-red-300 mb-3 font-semibold">
                {analysis.step6_red_flags.warning_message}
              </p>
              {analysis.step6_red_flags.specific_flags && (
                <ul className="space-y-1">
                  {analysis.step6_red_flags.specific_flags.map((flag, idx) => (
                    <li key={idx} className="text-xs text-red-200 flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Hierarchical Filters */}
          {analysis.step2_filters && (
            <div className="glass-cyan rounded-2xl p-6 border border-cyan-500/30">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3">🔍 Vorschalt-Filter</h4>
              <div className="space-y-2 text-sm">
                {analysis.step2_filters.needs_foot_check && (
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400">✓</span>
                    <span className="text-slate-300">Fuß-Sensorik-Check empfohlen (Fundament)</span>
                  </div>
                )}
                {analysis.step2_filters.needs_breath_work && (
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-slate-300">Atmungs-Regulation empfohlen (Sicherheit)</span>
                  </div>
                )}
                {analysis.step2_filters.filter_reasoning && (
                  <p className="text-xs text-slate-400 mt-2 italic">{analysis.step2_filters.filter_reasoning}</p>
                )}
              </div>
            </div>
          )}

          {/* Reasoning Questions */}
          {analysis.step3_reasoning?.differential_questions && analysis.step3_reasoning.differential_questions.length > 0 && (
            <div className="glass-purple rounded-2xl p-6 border border-purple-500/30">
              <h4 className="text-sm font-semibold text-purple-400 mb-3">🕵️ Detektiv-Fragen</h4>
              <div className="space-y-3">
                {analysis.step3_reasoning.differential_questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-sm text-slate-200 font-medium mb-1">{q.question}</p>
                    <p className="text-xs text-slate-400">{q.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extraction Results */}
          {analysis.step1_extraction && (
            <div className="glass rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3">📋 Extrahierte Informationen</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Region:</span>
                  <span className="text-slate-200 ml-2 font-medium">{analysis.step1_extraction.region}</span>
                </div>
                {analysis.step1_extraction.side && (
                  <div>
                    <span className="text-slate-400">Seite:</span>
                    <span className="text-slate-200 ml-2 font-medium">{analysis.step1_extraction.side}</span>
                  </div>
                )}
                {analysis.step1_extraction.trigger_position && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Trigger:</span>
                    <span className="text-slate-200 ml-2">{analysis.step1_extraction.trigger_position}</span>
                  </div>
                )}
                {analysis.step1_extraction.relief_position && (
                  <div className="col-span-2">
                    <span className="text-green-400">Besserung:</span>
                    <span className="text-slate-200 ml-2">{analysis.step1_extraction.relief_position}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hypothesis */}
          <div className="glass-cyan rounded-2xl p-6 border border-cyan-500/30">
            <h4 className="text-sm font-semibold text-cyan-400 mb-3">🧠 Was passiert in deinem Körper?</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{analysis.step5_hypothesis}</p>
            <p className="text-xs text-slate-500 mt-3 italic">
              💡 Dein Gehirn schützt diesen Bereich aktuell. Wir versuchen jetzt, ein Sicherheitssignal zu senden.
            </p>
          </div>

          {/* Test Recommendations */}
          {analysis.test_recommendations && analysis.test_recommendations.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-cyan-400 mb-4">🎯 Empfohlene Tests</h4>
              <div className="space-y-3">
                {analysis.test_recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${
                    rec.test_type === 'software' 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-cyan-500/10 border-cyan-500/30'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            rec.test_type === 'software' 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-cyan-500 text-slate-900'
                          }`}>
                            {rec.chain_code}
                          </span>
                          <span className="text-sm font-semibold text-slate-200">{rec.test_name}</span>
                        </div>
                        <p className="text-xs text-slate-400 ml-2">{rec.reasoning}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        rec.test_type === 'software' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {rec.test_type === 'software' ? 'Neuro' : 'Hardware'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Strategy */}
          {analysis.test_strategy && (
            <div className="glass rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3">
                {analysis.test_strategy === 'software_first' ? '🧠 Software-Fokus' : 
                 analysis.test_strategy === 'hardware_first' ? '🔧 Hardware-Fokus' : 
                 '⚖️ Mixed-Ansatz'}
              </h4>
              <p className="text-sm text-slate-300">
                {analysis.test_strategy === 'software_first' && 'Neuro-Drills werden priorisiert. HWS/Nervensystem steht im Fokus.'}
                {analysis.test_strategy === 'hardware_first' && 'Strukturelle Tests werden priorisiert. Faszien/Gewebe steht im Fokus.'}
                {analysis.test_strategy === 'mixed' && 'Sowohl Hardware- als auch Software-Tests sind relevant.'}
              </p>
            </div>
          )}

          {/* Chains */}
          <div className="glass rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-cyan-400 mb-3">🎯 Zu testende Ketten</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-2">Primär:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.primary_chains.map((chain) => (
                    <span key={chain} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-semibold border border-cyan-500/30">
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
              {analysis.secondary_chains && analysis.secondary_chains.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Sekundär:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.secondary_chains.map((chain) => (
                      <span key={chain} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-sm font-medium border border-slate-600">
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {analysis.recommended_priority && (
              <p className="mt-3 text-xs text-slate-400">
                <span className="font-semibold text-purple-400">Empfehlung:</span> Beginne mit {analysis.recommended_priority}
              </p>
            )}
          </div>

          {/* Hardware vs Software */}
          <div className="glass rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-cyan-400 mb-4">⚖️ Hardware vs. Software</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Hardware (Struktur)</span>
                  <span className="text-sm font-semibold text-cyan-400">{analysis.hardware_probability}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.hardware_probability}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Software (Nerven)</span>
                  <span className="text-sm font-semibold text-purple-400">{analysis.software_probability}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.software_probability}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold touch-target neuro-glow"
          >
            Weiter zu den Tests
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}