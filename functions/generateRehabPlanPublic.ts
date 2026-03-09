import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Public version of generateRehabPlan – no auth required, plan is returned but NOT saved to DB.
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

    // Fetch exercises, MFR nodes as service role (no user auth needed)
    const [allExercises, allRoutines, allMFRNodes] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 500),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.MFRNode.list('-updated_date', 50)
    ]);

    const validExercises = allExercises.filter(e => e.exercise_id && e.name);

    // Map region to MFR nodes for sling targeting
    const regionLower = (region || '').toLowerCase();
    const relevantMFRNodes = allMFRNodes.filter(node => {
      const targetChain = (node.target_chain || '').toLowerCase();
      const bodyArea = (node.body_area || '').toLowerCase();
      return targetChain.length > 0 || bodyArea.includes(regionLower.substring(0, 8));
    }).slice(0, 5);

    const targetSlings = [...new Set(
      relevantMFRNodes
        .map(node => node.target_chain || '')
        .map(c => c.split('/').map(s => s.toLowerCase().trim()).filter(Boolean))
        .flat()
    )];

    const smartFilteredExercises = validExercises.filter(e => {
      if (!targetSlings.length) return true;
      const primarySling = (e.smart_tags?.kinetic_chain_slings?.primary_sling || '').toLowerCase();
      return targetSlings.some(sling => primarySling.includes(sling));
    });

    const bestExercises = smartFilteredExercises.length >= 15 ? smartFilteredExercises : validExercises;

    const exerciseCatalog = bestExercises
      .map(e => [
        `ID: ${e.exercise_id}`,
        `Name: ${e.name}`,
        `Kategorie: ${e.category || '-'}`,
        `Schwierigkeit: ${e.difficulty || '-'}`,
        `Zweck: ${(e.purpose_explanation || '-').substring(0, 80)}`
      ].join(' | '))
      .join('\n');

    const extraContext = [
      pain_intensity ? `Schmerzintensität: ${pain_intensity}/10` : null,
      activity_level ? `Aktivitätslevel: ${activity_level}` : null,
      duration ? `Wie lange schon: ${duration}` : null
    ].filter(Boolean).join('\n');

    console.log(`[generateRehabPlanPublic] Region: "${region}", Slings: [${targetSlings.join(', ')}]`);

    const planData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Experte für neuro-athletische Rehabilitation (AXON-Methode). Erstelle einen personalisierten 3-Phasen-Reha-Plan.

PROBLEM:
Region: ${region}
${extraContext ? 'KONTEXT:\n' + extraContext : ''}

REGELN:
1. Verwende NUR exercise_ids aus dem KATALOG unten. NIEMALS erfinden.
2. Jede Phase MUSS 4-5 VERSCHIEDENE Übungen enthalten.
3. Die 3 Phasen müssen sich deutlich unterscheiden.

PHASE 1 – "RELEASE & CALM" (7 Tage): Schmerzlinderung, MFR, Atemarbeit. Nur beginner: neuro, breath, mfr, mobility.
PHASE 2 – "BUILD & STABILIZE" (14 Tage): Kräftigung, Stabilität. intermediate: core, mobility, plank, row.
PHASE 3 – "INTEGRATE & PERFORM" (14 Tage): Funktionell, Performance. intermediate/advanced: squat, hinge, carry.

ÜBUNGSKATALOG:
${exerciseCatalog}`,
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
                    required: ['exercise_id', 'name', 'sets_reps_tempo']
                  }
                }
              },
              required: ['phase_number', 'title', 'description', 'duration_days', 'exercises']
            }
          }
        },
        required: ['problem_summary', 'phases']
      }
    });

    if (!planData.phases || planData.phases.length === 0) {
      return Response.json({ error: 'Plan generation failed' }, { status: 502 });
    }

    // Enrich exercises with real data from DB
    const exerciseIdMap = Object.fromEntries(validExercises.map(e => [e.exercise_id, e]));

    const enrichedPhases = planData.phases.map(phase => {
      const enrichedExercises = (phase.exercises || []).map(exercise => {
        let ex = exerciseIdMap[exercise.exercise_id];
        if (!ex) {
          // fallback to difficulty-appropriate exercise
          ex = validExercises.find(e => {
            if (phase.phase_number === 1) return e.difficulty === 'beginner';
            if (phase.phase_number === 2) return e.difficulty === 'intermediate';
            return e.difficulty === 'advanced' || e.difficulty === 'intermediate';
          }) || validExercises[0];
        }
        if (!ex) return null;
        return {
          exercise_id: ex.exercise_id,
          name: ex.name,
          sets_reps_tempo: exercise.sets_reps_tempo,
          instruction: ex.description || null,
          notes: ex.axon_moment || exercise.notes || null,
          category: ex.category || null,
          difficulty: ex.difficulty || null,
          image_url: ex.image_url || null,
          completed: false
        };
      }).filter(Boolean);

      return { ...phase, exercises: enrichedExercises };
    }).filter(phase => phase.exercises.length > 0);

    console.log(`[generateRehabPlanPublic] Plan generated: ${enrichedPhases.length} phases for region "${region}"`);

    return Response.json({
      success: true,
      plan: {
        problem_summary: planData.problem_summary || `Rehab-Plan für: ${region}`,
        region,
        phases: enrichedPhases,
        plan_generated_date: new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('[generateRehabPlanPublic] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});