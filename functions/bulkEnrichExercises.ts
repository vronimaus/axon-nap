import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Konfiguration
const BATCH_SIZE = 3; // Klein halten um Timeouts zu vermeiden, zwingt Redeploy

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Nur Admins dürfen anreichern
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        // 1. Hole Kandidaten für Anreicherung
        // Sortieren nach updated_date aufsteigend (älteste zuerst)
        const exercises = await base44.asServiceRole.entities.Exercise.list('updated_date', 50);

        // Filtere Exercises, die bereits heute angereichert wurden
        const today = new Date().toISOString().split('T')[0];
        
        // Da wir keine komplexen Filter haben, holen wir die Logs und filtern im Memory
        const recentLogs = await base44.asServiceRole.entities.ExerciseEnrichmentLog.list('-enrichment_date', 100);

        const recentLogIds = new Set(recentLogs
            .filter(log => log.enrichment_date && log.enrichment_date.startsWith(today) && log.status === 'success')
            .map(log => log.exercise_id)
        );

        const candidates = exercises
            .filter(ex => !recentLogIds.has(ex.id))
            .slice(0, BATCH_SIZE);

        if (candidates.length === 0) {
             return Response.json({ message: 'No exercises found needing enrichment today (based on batch limits).' });
        }

        const results = [];

        // 2. Verarbeite Batch
        for (const exercise of candidates) {
            try {
                // Prompt Konstruktion
                const prompt = `
                Du bist ein Experte für Neuro-Athletik und funktionelles Training im AXON-System.
                Deine Aufgabe ist es, die Daten für die Übung "${exercise.name}" (ID: ${exercise.exercise_id}) zu optimieren und anzureichern.

                KONTEXT DER ÜBUNG (Bestehende Daten):
                Name: ${exercise.name}
                Beschreibung (alt): ${exercise.description || 'Leer'}
                Kategorie: ${exercise.category || 'Unbekannt'}
                Level: ${exercise.difficulty || 'Unbekannt'}

                RICHTLINIEN FÜR DEN INHALT (SEHR WICHTIG):
                1. SPRACHE: Deutsch, "DU-Form".
                2. TONALITÄT: "Normalo-freundlich". Keine anatomischen Fachbegriffe (sag "Oberschenkelrückseite" statt "Ischiocrurale Muskulatur"). Klar, direkt, motivierend.
                3. ZIEL: Der Nutzer soll die Übung OHNE VIDEO, nur durch Text verstehen und ausführen können.

                AUFGABEN PRO FELD (Priorisiert):
                1. description: Die WICHTIGSTE Anleitung. Kombiniere die Bewegungsausführung, wichtige Technik-Tipps (Cues) und die Atmung in einen flüssigen, schrittweisen Text. Der Nutzer liest nur das und muss es können.
                2. cues: 3-5 kurze, knackige Stichpunkte als mentale Anker (z.B. "Bauchnabel reinziehen").
                3. breathing_instruction: Eine präzise Anweisung, wann ein- und ausgeatmet wird.
                4. axon_moment: Was soll der Nutzer FÜHLEN oder VERSTEHEN? (z.B. "Spüre, wie sich dein Brustkorb weitet").
                5. benefits: Was bringt mir das? (z.B. "Macht deinen Nacken locker für den Schreibtisch-Alltag").
                6. progression_basic: Eine leichtere Variante (Label, Beschreibung, Fokus).
                7. progression_advanced: Eine schwerere Variante (Label, Beschreibung, Fokus).
                8. goal_explanation: Warum machen wir das im Training?
                9. modification_suggestions_yellow: Was tun, wenn ich mich heute nur "mittelmäßig" (Gelb) fühle?
                10. modification_suggestions_red: Was tun bei Schmerz/Müdigkeit (Rot)?
                11. upgrade_neuro_reason: Warum ist die nächste Stufe neurologisch anspruchsvoller?

                Generiere JSON basierend auf diesen Anweisungen.
                `;

                // Nutze Base44 Core Integration InvokeLLM
                const enrichedData = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: prompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            description: { type: "string" },
                            cues: { type: "array", items: { type: "string" } },
                            breathing_instruction: { type: "string" },
                            axon_moment: { type: "string" },
                            benefits: { type: "string" },
                            progression_basic: {
                                type: "object",
                                properties: {
                                    label: { type: "string" },
                                    description: { type: "string" },
                                    focus: { type: "string" }
                                }
                            },
                            progression_advanced: {
                                type: "object",
                                properties: {
                                    label: { type: "string" },
                                    description: { type: "string" },
                                    focus: { type: "string" }
                                }
                            },
                            goal_explanation: { type: "string" },
                            modification_suggestions_yellow: { type: "string" },
                            modification_suggestions_red: { type: "string" },
                            upgrade_neuro_reason: { type: "string" }
                        }
                    }
                });

                // 3. Update Exercise
                // Wir mergen die neuen Daten.
                await base44.asServiceRole.entities.Exercise.update(exercise.id, enrichedData);

                // 4. Log Success
                await base44.asServiceRole.entities.ExerciseEnrichmentLog.create({
                    exercise_id: exercise.id,
                    status: 'success',
                    enrichment_date: new Date().toISOString(),
                    enriched_fields: Object.keys(enrichedData),
                    ai_model: "base44.Core.InvokeLLM",
                    ai_response_json: JSON.stringify(enrichedData).substring(0, 1000) 
                });

                results.push({ id: exercise.id, name: exercise.name, status: 'success' });

            } catch (innerError) {
                console.error(`Error enriching exercise ${exercise.id}:`, innerError);
                
                // Log Error
                await base44.asServiceRole.entities.ExerciseEnrichmentLog.create({
                    exercise_id: exercise.id || 'unknown',
                    status: 'error',
                    enrichment_date: new Date().toISOString(),
                    error_details: innerError.message
                });

                results.push({ id: exercise.id, name: exercise.name, status: 'error', error: innerError.message });
            }
        }

        return Response.json({ 
            message: `Batch processing complete. Processed ${results.length} exercises.`,
            results 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});