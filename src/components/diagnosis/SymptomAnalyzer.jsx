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

Analysiere diese Symptombeschreibung und identifiziere:

1. Betroffene Körperregionen
2. Involvierte Faszialketten (aus: SBL, SFL, LL, SPL, AL, FL, DFL)
3. Wahrscheinlichkeit Hardware vs. Software Problem
4. Positionsabhängigkeit oder Bewegungsabhängigkeit

KRITISCHE LOGIK FÜR LAGERUNGSABHÄNGIGE SCHMERZEN:
- Wenn Schmerz durch KOMPRESSION (Liegen auf Seite) auftritt → Priorisiere Laterallinie (LL)
- Wenn Schmerz in Rhomboideen/zwischen Schulterblättern zieht → Priorisiere Spirallinie (SPL)
- Wenn KOPFBEWEGUNG zur Gegenseite den Schmerz reduziert → Neuraler Fokus (Software-Problem 80%+)
  → Empfehle Visual-Drills (Sakkaden/Blick) zur schmerzfreien Seite
- Wenn Schmerz positionsabhängig ist → Software-Wahrscheinlichkeit höher (HWS/Vestibulär/Plexus)

BEISPIEL-MUSTER: "Schmerz links beim Liegen auf linker Seite, besser bei Kopf nach rechts"
→ Analyse: LL (Kompression) + SPL (Rhomboideen) + Software (HWS-Nerven)
→ Empfehlung: Primär Neuro-Drills (Visual-Sakkaden nach rechts), sekundär Hardware-Tests

Symptombeschreibung:
"${description}"

Gib eine präzise Einschätzung mit funktionaler Begründung.`,
        response_json_schema: {
          type: "object",
          properties: {
            affected_regions: {
              type: "array",
              items: { type: "string" },
              description: "Körperregionen (z.B. Nacken, Schulter, Rücken)"
            },
            primary_chains: {
              type: "array",
              items: { type: "string" },
              description: "Haupt-Faszialketten (Codes: SBL, SFL, LL, SPL, AL, FL, DFL)"
            },
            secondary_chains: {
              type: "array",
              items: { type: "string" },
              description: "Sekundäre Ketten"
            },
            hardware_probability: {
              type: "number",
              description: "0-100 Wahrscheinlichkeit für Hardware-Problem"
            },
            software_probability: {
              type: "number",
              description: "0-100 Wahrscheinlichkeit für Software-Problem"
            },
            reasoning: {
              type: "string",
              description: "Begründung der Analyse"
            },
            key_findings: {
              type: "array",
              items: { type: "string" },
              description: "Wichtigste Erkenntnisse aus der Beschreibung"
            },
            recommended_priority: {
              type: "string",
              description: "Welche Kette sollte zuerst getestet werden"
            },
            positional_dependency: {
              type: "object",
              properties: {
                is_positional: { type: "boolean" },
                trigger_position: { type: "string" },
                relief_position: { type: "string" },
                recommended_drill: { type: "string" }
              }
            },
            test_strategy: {
              type: "string",
              enum: ["software_first", "hardware_first", "mixed"],
              description: "Welche Tests sollten priorisiert werden"
            }
          },
          required: ["affected_regions", "primary_chains", "hardware_probability", "software_probability", "reasoning"]
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
          {/* Reasoning */}
          <div className="glass rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-cyan-400 mb-3">🧠 Analyse-Ergebnis</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* Positional Dependency */}
          {analysis.positional_dependency?.is_positional && (
            <div className="glass-purple rounded-2xl p-6 border border-purple-500/30">
              <h4 className="text-sm font-semibold text-purple-400 mb-3">📍 Lagerungsabhängigkeit erkannt</h4>
              <div className="space-y-2 text-sm text-slate-300">
                {analysis.positional_dependency.trigger_position && (
                  <p>
                    <span className="text-purple-400 font-semibold">Trigger:</span> {analysis.positional_dependency.trigger_position}
                  </p>
                )}
                {analysis.positional_dependency.relief_position && (
                  <p>
                    <span className="text-green-400 font-semibold">Besserung:</span> {analysis.positional_dependency.relief_position}
                  </p>
                )}
                {analysis.positional_dependency.recommended_drill && (
                  <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-xs text-purple-400 font-semibold mb-1">Empfohlener Visual-Drill:</p>
                    <p className="text-sm">{analysis.positional_dependency.recommended_drill}</p>
                  </div>
                )}
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

          {/* Key Findings */}
          {analysis.key_findings && analysis.key_findings.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3">🔍 Wichtige Erkenntnisse</h4>
              <ul className="space-y-2">
                {analysis.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-500 mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
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