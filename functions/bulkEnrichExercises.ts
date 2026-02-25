import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai@0.1.3";

// Konfiguration
const BATCH_SIZE = 3; // Klein halten um Timeouts zu vermeiden
const MODEL_NAME = "gemini-1.5-flash"; // Schnell und gut genug für Textanreicherung

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Nur Admins dürfen anreichern
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        description: { type: SchemaType.STRING },
                        cues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        breathing_instruction: { type: SchemaType.STRING },
                        axon_moment: { type: SchemaType.STRING },
                        benefits: { type: SchemaType.STRING },
                        progression_basic: {
                            type: SchemaType.OBJECT,
                            properties: {
                                label: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                focus: { type: SchemaType.STRING }
                            }
                        },
                        progression_advanced: {
                            type: SchemaType.OBJECT,
                            properties: {
                                label: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                focus: { type: SchemaType.STRING }
                            }
                        },
                        goal_explanation: { type: SchemaType.STRING },
                        modification_suggestions_yellow: { type: SchemaType.STRING },
                        modification_suggestions_red: { type: SchemaType.STRING },
                        upgrade_neuro_reason: { type: SchemaType.STRING }
                    }
                }
            }
        });

        // 1. Hole Kandidaten für Anreicherung
        // Strategie: Wir holen Exercises und prüfen gegen Logs, welche am längsten nicht angereichert wurden
        // Da wir (noch) kein 'last_enriched' Feld haben, holen wir einfach eine Batch und filtern manuell oder nehmen zufällige
        // Für diesen MVP: Hole die ersten X Exercises. In Produktion würde man hier smarter filtern.
        // Besser: Wir sortieren nach updated_date aufsteigend (älteste zuerst)
        const exercises = await base44.asServiceRole.entities.Exercise.list('updated_date', 50);

        // Filtere Exercises, die bereits heute angereichert wurden (via Logs check)
        // Das ist etwas ineffizient ohne direkten Filter, aber für kleine Mengen ok.
        const today = new Date().toISOString().split('T')[0];
        const recentLogs = await base44.asServiceRole.entities.ExerciseEnrichmentLog.filter({
             // Wir können hier schwer nach Datum filtern ohne Range Queries, daher holen wir die letzten Logs
        }, '-enrichment_date', 100);

        const recentLogIds = new Set(recentLogs
            .filter(log => log.enrichment_date.startsWith(today) && log.status === 'success')
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

                const result = await model.generateContent(prompt);
                const response = result.response;
                const jsonText = response.text();
                const enrichedData = JSON.parse(jsonText);

                // 3. Update Exercise
                // Wir mergen die neuen Daten. Achtung: Wir überschreiben vorhandene Felder, da wir "optimieren" wollen.
                await base44.asServiceRole.entities.Exercise.update(exercise.id, enrichedData);

                // 4. Log Success
                await base44.asServiceRole.entities.ExerciseEnrichmentLog.create({
                    exercise_id: exercise.id,
                    status: 'success',
                    enrichment_date: new Date().toISOString(),
                    enriched_fields: Object.keys(enrichedData),
                    ai_model: MODEL_NAME,
                    ai_response_json: JSON.stringify(enrichedData).substring(0, 1000) // Begrenzen
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