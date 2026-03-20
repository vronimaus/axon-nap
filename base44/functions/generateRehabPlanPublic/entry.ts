import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Public version of generateRehabPlan – no auth required, full plan returned but NOT saved to DB.
// After login, the frontend saves it via base44.entities.RehabPlan.create()

Deno.serve(async (req) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { region, pain_intensity, activity_level, duration } = body;

    if (!region) {
      return Response.json({ error: 'region is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Fetch exercises, routines, FAQs, and MFRNodes (GOLDEN SOURCE)
    const [allExercises, allRoutines, allFaqs, allMFRNodes] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 500),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100),
      base44.asServiceRole.entities.MFRNode.list('-updated_date', 50)
    ]);

    const validExercises = allExercises.filter(e => e.exercise_id && e.name);
    const availableExerciseIds = validExercises.map(e => e.exercise_id);
    const availableRoutineIds = allRoutines.slice(0, 10).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 10).map(f => f.faq_id).filter(Boolean);

    // GOLDEN SOURCE: Map region to MFRNodes and extract target chains/slings
    const regionLower = (region || '').toLowerCase();
    const relevantMFRNodes = allMFRNodes.filter(node => {
      const targetChain = (node.target_chain || '').toLowerCase();
      const bodyArea = (node.body_area || '').toLowerCase();
      return targetChain.length > 0 || bodyArea.includes(regionLower.substring(0, 8));
    }).slice(0, 5);

    const targetSlings = [...new Set(
      relevantMFRNodes
        .map(node => {
          const chain = node.target_chain || '';
          return chain.split('/').map(c => c.toLowerCase().trim()).filter(Boolean);
        })
        .flat()
    )];

    console.log(`[generateRehabPlanPublic] Region "${region}" → MFR Nodes: ${relevantMFRNodes.length}, Target Slings: [${targetSlings.join(', ')}]`);

    // Smart filtering: exercises matching target slings via smart_tags.kinetic_chain_slings.primary_sling
    const smartFilteredExercises = validExercises.filter(e => {
      if (!targetSlings.length) return true;
      const primarySling = (e.smart_tags?.kinetic_chain_slings?.primary_sling || '').toLowerCase();
      return targetSlings.some(sling => primarySling.includes(sling));
    });

    const bestExercises = smartFilteredExercises.length >= 15 ? smartFilteredExercises : validExercises;

    // Build a rich catalog: each exercise on its own line with all relevant fields
    const exerciseCatalog = bestExercises
      .map(e => [
        `ID: ${e.exercise_id}`,
        `Name: ${e.name}`,
        `Kategorie: ${e.category || '-'}`,
        `Schwierigkeit: ${e.difficulty || '-'}`,
        `Sling: ${e.smart_tags?.kinetic_chain_slings?.primary_sling || '-'}`,
        `Zweck: ${e.purpose_explanation || '-'}`,
        `AXONMoment: ${e.axon_moment || '-'}`
      ].join(' | '))
      .join('\n');

    const contextParts = [];
    if (pain_intensity) contextParts.push(`Schmerzintensität: ${pain_intensity}/10`);
    if (activity_level) contextParts.push(`Aktivitätslevel: ${activity_level}`);
    if (duration) contextParts.push(`Wie lange schon: ${duration}`);
    const extraContext = contextParts.join('\n');

    console.log(`[generateRehabPlanPublic] Filtered exercises: ${bestExercises.length}/${validExercises.length}`);

    const planData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Experte für neuro-athletische Rehabilitation (AXON-Methode). Erstelle einen hochwertig personalisierten 3-Phasen-Reha-Plan.

PROBLEM DES NUTZERS:
Region: ${region}
${extraContext ? 'KONTEXT:\n' + extraContext : ''}

ZIEL-FASZIEN-KETTEN (aus Schmerzregion erkannt):
${targetSlings.length > 0 ? targetSlings.join(', ') : 'alle Ketten berücksichtigen'}

===== ABSOLUT ZWINGENDE REGELN =====
1. Verwende NUR exercise_ids aus dem ÜBUNGSKATALOG unten. NIEMALS erfinden.
2. Kopiere die exercise_id EXAKT so wie sie im Katalog steht.
3. JEDE Phase MUSS 5-7 VERSCHIEDENE Übungen enthalten.
4. Die 3 Phasen MÜSSEN sich deutlich voneinander unterscheiden – andere Übungen, andere Progression.
5. sets_reps_tempo MUSS sehr konkret sein, z.B. "3×10 langsam (3 Sek. runter, 1 Sek. oben)", "2×60 Sek. halten", "4×8 explosiv".
6. notes MUSS den AXON-Moment beschreiben (was der User fühlen/lernen soll). Sei spezifisch.

===== PHASEN-PHILOSOPHIE (CRITICAL – unterschiedliche Übungen pro Phase!) =====

PHASE 1 – "RELEASE & CALM" (7 Tage, Akut-Phase):
→ Ziel: Schmerzlinderung, parasympathische Aktivierung, MFR, Atemarbeit
→ Nur beginner-Übungen: Kategorie neuro, breath, mfr, mobility
→ Sanft: Kein Kraft, kein Impuls
→ Beispiel-Fokus: Nervenberuhigung, Faszienentspannung, Körperwahrnehmung

PHASE 2 – "BUILD & STABILIZE" (14 Tage, Aufbau-Phase):
→ Ziel: Kräftigung, Stabilität, Bewegungsmuster neu lernen
→ intermediate-Übungen: Kategorie core, mobility, plank, row, pull, push
→ Aufbau der neuronalen Ansteuerung, tiefe Stabilisatoren aktivieren
→ ANDERE Übungen als Phase 1 – Progression!

PHASE 3 – "INTEGRATE & PERFORM" (14 Tage, Performance-Phase):
→ Ziel: Funktionelle Bewegung, Alltagsintegration, Prävention, Performance
→ intermediate/advanced: Komplexe Bewegungen, Kraft + Neuro kombiniert
→ Kategorie: squat, hinge, carry, functional, strength
→ ANDERE Übungen als Phase 1 & 2 – deutlicher Schwierigkeitssprung

===== ÜBUNGSKATALOG (ALLE IDs sind real – EXAKT so übernehmen) =====
${exerciseCatalog}

===== VERFÜGBARE ROUTINE-IDs =====
${availableRoutineIds.join(', ')}

===== VERFÜGBARE FAQ-IDs =====
${availableFaqIds.join(', ')}`,
      response_json_schema: {
        type: 'object',
        properties: {
          problem_summary: { type: 'string' },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase_number: { type: 'integer' },
                title: { type: 'string' },
                description: { type: 'string' },
                duration_days: { type: 'integer' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      exercise_id: { type: 'string' },
                      name: { type: 'string' },
                      sets_reps_tempo: { type: 'string' },
                      instruction: { type: 'string' },
                      notes: { type: 'string' }
                    },
                    required: ['exercise_id', 'name', 'sets_reps_tempo', 'instruction']
                  }
                }
              },
              required: ['phase_number', 'title', 'description', 'duration_days', 'exercises']
            }
          },
          recommended_mfr_routines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                routine_id: { type: 'string' },
                routine_name: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['routine_id', 'routine_name', 'reason']
            }
          },
          recommended_faqs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                faq_id: { type: 'string' },
                question: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['faq_id', 'question', 'reason']
            }
          }
        },
        required: ['problem_summary', 'phases', 'recommended_mfr_routines', 'recommended_faqs']
      }
    });

    if (!planData.phases || !Array.isArray(planData.phases) || planData.phases.length === 0) {
      return Response.json({ error: 'LLM returned no phases' }, { status: 502 });
    }

    // Filter to valid IDs only (soft validation)
    const validRoutines = (planData.recommended_mfr_routines || []).filter(r =>
      allRoutines.find(ar => ar.id === r.routine_id)
    );
    const validFaqs = (planData.recommended_faqs || []).filter(f =>
      allFaqs.find(af => af.faq_id === f.faq_id)
    );

    // STRICT VALIDATION: Golden Source mapping (exercise_id → DB object)
    const exerciseIdMap = Object.fromEntries(validExercises.map(e => [e.exercise_id, e]));
    const hallucinations = [];

    const enrichedPhases = (await Promise.all(
      planData.phases.map(async (phase) => {
        const enrichedExercises = (await Promise.all(
          (phase.exercises || []).map(async (exercise) => {
            const requestedId = exercise.exercise_id;
            let ex = exerciseIdMap[requestedId];

            if (!ex) {
              hallucinations.push(requestedId);
              console.warn(`[generateRehabPlanPublic] HALLUCINATION: "${requestedId}" not in Golden Source`);
              ex = validExercises.find(e => {
                if (phase.phase_number === 1) return e.difficulty === 'beginner';
                if (phase.phase_number === 2) return e.difficulty === 'intermediate';
                return e.difficulty === 'advanced' || e.difficulty === 'intermediate';
              }) || validExercises[Math.floor(Math.random() * validExercises.length)];
              if (ex) console.log(`  → Using fallback: "${ex.exercise_id}" (${ex.name})`);
            }

            if (!ex) {
              console.error(`[generateRehabPlanPublic] No valid exercise found for phase ${phase.phase_number}`);
              return null;
            }

            return {
              exercise_id: ex.exercise_id,
              name: ex.name,
              sets_reps_tempo: exercise.sets_reps_tempo,
              instruction: ex.description || null,
              notes: ex.axon_moment || exercise.notes || null,
              description: ex.description || null,
              axon_moment: ex.axon_moment || null,
              breathing_instruction: ex.breathing_instruction || null,
              purpose_explanation: ex.purpose_explanation || null,
              goal_explanation: ex.goal_explanation || null,
              benefits: ex.benefits || null,
              cues: ex.cues || [],
              category: ex.category || null,
              difficulty: ex.difficulty || null,
              image_url: ex.image_url || null,
              gif_url: ex.gif_url || null,
              progression_basic: ex.progression_basic || null,
              progression_advanced: ex.progression_advanced || null,
              modification_suggestions_yellow: ex.modification_suggestions_yellow || null,
              modification_suggestions_red: ex.modification_suggestions_red || null,
              completed: false
            };
          })
        )).filter(ex => ex !== null);

        console.log(`[generateRehabPlanPublic] Phase ${phase.phase_number}: ${enrichedExercises.length}/${(phase.exercises||[]).length} valid`);
        return { ...phase, exercises: enrichedExercises };
      })
    )).filter(phase => phase.exercises.length > 0);

    if (hallucinations.length > 0) {
      console.error(`[generateRehabPlanPublic] HALLUCINATION REPORT: ${hallucinations.length} invalid IDs:`, hallucinations);
    }

    if (enrichedPhases.length === 0) {
      return Response.json({ error: 'No valid exercises generated', hallucinations }, { status: 502 });
    }

    const plan = {
      problem_summary: planData.problem_summary || `Rehab-Plan für: ${region}`,
      region,
      phases: enrichedPhases,
      recommended_mfr_routines: validRoutines,
      recommended_faqs: validFaqs,
      plan_generated_date: new Date().toISOString().split('T')[0]
    };

    console.log(`[generateRehabPlanPublic] Plan generated: ${enrichedPhases.length} phases for region "${region}"`);

    return Response.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('[generateRehabPlanPublic] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});