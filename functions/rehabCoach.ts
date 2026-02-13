import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, rehabPlan, exercise, feedbackHistory } = await req.json();

    console.log('[rehabCoach] Action:', action);

    // Aktion 1: Übungsvariationen vorschlagen
    if (action === 'suggest_variations') {
      const prompt = `Du bist ein Reha-Coach. Analysiere folgendes:

Aktueller Plan: ${rehabPlan.problem_summary}
Aktuelle Phase: ${rehabPlan.current_phase}/${rehabPlan.phases.length}

Übung: ${exercise.name}
${exercise.goal_explanation || ''}

Feedback-Historie (letzte 5 Einträge):
${feedbackHistory.slice(-5).map(f => `- Schmerzlevel: ${f.metric_value}/10, Notiz: ${f.notes || 'Keine'}`).join('\n')}

Basierend auf dem Fortschritt: Schlage 3 Übungsvariationen vor (einfacher, gleich schwer, schwerer).
Jede Variation sollte haben:
- name: Kurzer Name
- difficulty: "easier", "same", "harder"
- description: Kurze Anleitung
- why: Warum diese Variation jetzt sinnvoll ist`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  difficulty: { type: "string" },
                  description: { type: "string" },
                  why: { type: "string" }
                }
              }
            }
          }
        }
      });

      return Response.json({ variations: response.variations });
    }

    // Aktion 2: Neue Übungen für Schwachstellen generieren
    if (action === 'generate_exercise') {
      const { weakness, currentExercises } = await req.json();
      
      const prompt = `Du bist ein Reha-Coach. Der User hat folgende Schwachstelle identifiziert:
${weakness}

Aktuelles Problem: ${rehabPlan.problem_summary}
Bereits im Plan: ${currentExercises.map(e => e.name).join(', ')}

Feedback-Trend: 
${feedbackHistory.slice(-10).map(f => `Schmerzlevel: ${f.metric_value}/10`).join(', ')}

Generiere eine neue, spezifische Übung die:
1. Diese Schwachstelle gezielt angeht
2. Sich nicht mit existierenden Übungen überschneidet
3. Zum aktuellen Fortschritt passt

Gib zurück:
- name: Übungsname
- category: Eine der Kategorien (mfr, mobility, strength, neuro)
- sets_reps_tempo: Format wie "3 x 10 reps, 2-0-2 Tempo"
- instruction: Detaillierte Schritt-für-Schritt-Anleitung
- goal_explanation: Warum ist diese Übung jetzt wichtig?
- benefits: Was bringt sie dem User konkret?`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            sets_reps_tempo: { type: "string" },
            instruction: { type: "string" },
            goal_explanation: { type: "string" },
            benefits: { type: "string" }
          }
        }
      });

      return Response.json({ exercise: response });
    }

    // Aktion 3: Adaptive Cues basierend auf Fortschritt
    if (action === 'adapt_cues') {
      const avgPain = feedbackHistory.length > 0
        ? feedbackHistory.slice(-5).reduce((sum, f) => sum + f.metric_value, 0) / Math.min(5, feedbackHistory.length)
        : 5;

      const recentNotes = feedbackHistory.slice(-3).map(f => f.notes).filter(Boolean).join('; ');

      const prompt = `Du bist ein Reha-Coach. Passe die Übungserklärung an den Fortschritt an:

Übung: ${exercise.name}
Original-Erklärung: ${exercise.goal_explanation || exercise.instruction}

Aktueller Fortschritt:
- Ø Schmerzlevel (letzte 5 Sessions): ${avgPain.toFixed(1)}/10
- Letzte Notizen: ${recentNotes || 'Keine'}
- Phase: ${rehabPlan.current_phase}/${rehabPlan.phases.length}

Basierend darauf:
1. Wenn Schmerzlevel > 6: Ermutige, langsamer zu machen, gib sanfte Varianten
2. Wenn Schmerzlevel 3-6: Motiviere weiterzumachen, erkläre warum es normal ist
3. Wenn Schmerzlevel < 3: Gratuliere, schlage Progression vor

Gib eine angepasste Erklärung und 2-3 spezifische Cues zurück.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            adapted_explanation: { type: "string" },
            cues: {
              type: "array",
              items: { type: "string" }
            },
            motivation: { type: "string" }
          }
        }
      });

      return Response.json({ 
        adapted_explanation: response.adapted_explanation,
        cues: response.cues,
        motivation: response.motivation
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[rehabCoach] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});