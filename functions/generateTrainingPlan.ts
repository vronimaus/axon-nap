import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { goal_description, baseline, activity_level, experience_level, primary_sport } = body;

    if (!goal_description) {
      return Response.json({ error: 'goal_description required' }, { status: 400 });
    }

    // Fetch user's neuro profile (optional - use body params as fallback)
    let profile = null;
    try {
      const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
      profile = profiles[0] || null;
    } catch (_e) {
      profile = null;
    }

    const activityLvl = activity_level || profile?.activity_level || 'moderately_active';
    const expLvl = experience_level || profile?.training_experience || 'intermediate';
    const sport = primary_sport || profile?.primary_sport || '';
    const fitnessGoals = profile?.fitness_goals?.join(', ') || 'improve_performance';

    // Fetch user's PerformanceBaseline data
    let baselineData = '';
    try {
      const baselines = await base44.entities.PerformanceBaseline.filter({ user_email: user.email }, '-test_date', 10);
      if (baselines.length > 0) {
        baselineData = baselines.map(b =>
          `${b.test_name}: ${b.result_value} ${b.result_unit} → Level: ${b.baseline_level}`
        ).join('\n');
      }
    } catch (_e) {
      baselineData = '';
    }

    // Fetch exercises, routines, FAQs
    const [allExercises, allRoutines, allFaqs] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 200),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100)
    ]);

    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(Boolean);
    const availableRoutineIds = allRoutines.slice(0, 10).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 10).map(f => f.faq_id).filter(Boolean);

    // Build rich exercise catalog for the LLM with semantic context for goal matching
    const exerciseCatalog = allExercises
      .filter(e => e.exercise_id)
      .map(e => {
        const tags = [e.category, e.difficulty, e.stecco_chain].filter(Boolean).join(' | ');
        const goals = (e.related_performance_goals || []).join(', ');
        const mechanics = (e.mechanical_impact_type || []).join(', ');
        const neuroImpact = (e.neuro_impact_type || []).join(', ');
        const fms = e.fms_pattern || '';
        const purpose = e.purpose_explanation
          ? e.purpose_explanation.slice(0, 100).replace(/\n/g, ' ')
          : '';

        const parts = [
          `- ${e.exercise_id}: "${e.name}" [${tags}]`,
          goals ? `Ziele: ${goals}` : '',
          mechanics ? `Mechanik: ${mechanics}` : '',
          neuroImpact ? `Neuro: ${neuroImpact}` : '',
          fms ? `FMS: ${fms}` : '',
          purpose ? `Zweck: ${purpose}` : '',
        ].filter(Boolean);

        return parts.join(' | ');
      })
      .join('\n');

    console.log(`[generateTrainingPlan] Goal: ${goal_description}, Exercises: ${availableExerciseIds.length}`);

    // Build exercise lookup for enrichment
    const exerciseLookup = {};
    for (const ex of allExercises) {
      if (ex.exercise_id) exerciseLookup[ex.exercise_id] = ex;
    }

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein hochspezialisierter Trainingsplaner mit Expertise in funktioneller Bewegung, neuronaler Aktivierung, Faszientraining (Stecco) und Kraftentwicklung.

Erstelle einen wissenschaftlich fundierten 3-Phasen Trainingsplan auf Deutsch für:

Ziel: "${goal_description}"
Baseline / Aktueller Stand: ${baseline || 'Nicht angegeben'}
Activity Level: ${activityLvl}
Trainingserfahrung: ${expLvl}
Primärsport: ${sport || 'keiner angegeben'}
Fitness-Ziele: ${fitnessGoals}

════════════════════════════════════════════
WICHTIGER AUSWAHLPROZESS (bitte befolgen):
════════════════════════════════════════════
1. Analysiere das Ziel: Welche Gelenke, Muskeln, Faszien-Ketten, Bewegungsmuster sind relevant?
2. Identifiziere: Was braucht das Ziel an Mobility, Neuronaler Kontrolle und Kraft?
3. Wähle Übungen mit passendem [Mechanik]-Tag (z.B. "mobility" für Gelenkfreiheit, "stability" für Kontrolle, "strength" für Kraft)
4. Wähle Übungen mit passendem [Neuro]-Tag wenn vorhanden (calming, activating, balance, vestibular_stim)
5. Nutze FMS-Pattern und Zweck-Beschreibung für semantisches Matching

PHASEN-LOGIK:
- Phase 1 (Foundation, 2 Wochen): Gelenk-Mobility + neuronale Aktivierung + Körperwahrnehmung. intensity_factor: 1.0–1.2
- Phase 2 (Development, 3 Wochen): Kraftaufbau + Bewegungsmuster + Hilfsmuskeln. intensity_factor: 1.5–2.0
- Phase 3 (Mastery, 3 Wochen): Zielübung + funktionelle Integration + Intensitätssteigerung. intensity_factor: 2.0–2.5

Jede Phase MUSS mindestens 5 Übungen enthalten mit konkreten deutschen Ausführungsanweisungen.
Wähle VIELFÄLTIG: Mobility, Neuro-Drills, Breath, Strength, Core – je nach Phasenziel.

Für jeden Exercise: Weise intensity_factor zu (1.0=Rehab/Mobility, 1.5=Integration, 2.5=Performance/Kraft).
Bestimme primary_sling des Plans (anterior, posterior, lateral oder deep_frontal).
Bestimme target_nodes (z.B. N10_Shoulder_Complex, N11_LSO_Pelvis, N12_Hip_Ankle).
Erstelle eine progression_matrix mit 4-5 aufbauenden Übungen vom einfachsten bis zum Ziel.

⚠️ KRITISCH: Du DARFST NUR exercise_ids aus der folgenden Liste verwenden.
Erfinde KEINE eigenen exercise_ids. Verwende die Metadaten (Ziele, Mechanik, Neuro, FMS, Zweck) um semantisch die besten Matches zu finden.

✅ VERFÜGBARE Übungen (ID: Name [Kategorie | Schwierigkeit | Kette] | Ziele | Mechanik | Neuro | FMS | Zweck):
${exerciseCatalog}

    Verfügbare Routine-IDs:
    ${availableRoutineIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}

    Verfügbare FAQ-IDs:
    ${availableFaqIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}`,
      response_json_schema: {
        type: 'object',
        properties: {
          primary_sling: { type: 'string', description: 'anterior | posterior | lateral | deep_frontal' },
          target_nodes: { type: 'array', items: { type: 'string' } },
          progression_matrix: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level: { type: 'integer' },
                exercise_id: { type: 'string' },
                threshold: { type: 'string' },
                rehab_proxy: { type: 'string' },
                intensity_factor: { type: 'number' }
              },
              required: ['level', 'exercise_id', 'threshold']
            }
          },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phase_number: { type: 'integer' },
                title: { type: 'string' },
                description: { type: 'string' },
                duration_weeks: { type: 'integer' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      exercise_id: { type: 'string' },
                      name: { type: 'string' },
                      sets_reps_tempo: { type: 'string' },
                      instruction: { type: 'string' },
                      notes: { type: 'string' },
                      intensity_factor: { type: 'number' },
                      sling_id: { type: 'string' },
                      target_nodes: { type: 'array', items: { type: 'string' } },
                      rehab_proxy: { type: 'string' }
                    },
                    required: ['exercise_id', 'name', 'sets_reps_tempo', 'instruction']
                  }
                }
              },
              required: ['phase_number', 'title', 'description', 'duration_weeks', 'exercises']
            }
          },
          recommended_routines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                routine_id: { type: 'string' },
                routine_name: { type: 'string' },
                reason: { type: 'string' },
                frequency: { type: 'string' }
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
        required: ['phases', 'recommended_routines', 'recommended_faqs']
      }
    });

    if (!planData.phases || !Array.isArray(planData.phases) || planData.phases.length === 0) {
      return Response.json({ error: 'LLM returned no phases' }, { status: 502 });
    }

    // Soft-validate: filter invalid IDs instead of failing
    const validRoutines = (planData.recommended_routines || []).filter(r =>
      allRoutines.find(ar => ar.id === r.routine_id)
    );
    const validFaqs = (planData.recommended_faqs || []).filter(f =>
      allFaqs.find(af => af.faq_id === f.faq_id)
    );

    // Validate exercise IDs and log warnings for invalid ones
    const validExerciseIdSet = new Set(availableExerciseIds);

    // Enrich exercises with DB data using in-memory lookup (no extra API calls)
    const enrichedPhases = planData.phases.map((phase) => {
      const enrichedExercises = (phase.exercises || [])
        .filter(exercise => {
          const isValid = validExerciseIdSet.has(exercise.exercise_id);
          if (!isValid) {
            console.warn(`[generateTrainingPlan] Invalid exercise_id from LLM: "${exercise.exercise_id}" – skipping`);
          }
          return isValid;
        })
        .map((exercise) => {
          const dbEx = exerciseLookup[exercise.exercise_id];
          if (dbEx) {
            return {
              ...exercise,
              name: dbEx.name || exercise.name,
              description: dbEx.description || exercise.instruction,
              axon_moment: dbEx.axon_moment,
              breathing_instruction: dbEx.breathing_instruction,
              purpose_explanation: dbEx.purpose_explanation,
              cues: dbEx.cues,
              category: dbEx.category,
              difficulty: dbEx.difficulty,
              image_url: dbEx.image_url,
              gif_url: dbEx.gif_url,
              benefits: dbEx.benefits,
              progression_basic: dbEx.progression_basic,
              progression_advanced: dbEx.progression_advanced,
              stecco_chain: dbEx.stecco_chain,
            };
          }
          return exercise;
        });
      return { ...phase, exercises: enrichedExercises };
    });

    const plan = await base44.asServiceRole.entities.TrainingPlan.create({
      user_email: user.email,
      goal_description,
      phases: enrichedPhases,
      progression_matrix: planData.progression_matrix || [],
      primary_sling: planData.primary_sling || 'anterior',
      target_nodes: planData.target_nodes || [],
      recommended_routines: validRoutines,
      recommended_faqs: validFaqs,
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      status: 'active'
    });

    console.log(`[generateTrainingPlan] Plan created: ${plan.id} with ${enrichedPhases.length} phases`);

    return Response.json({ success: true, plan_id: plan.id, plan });

  } catch (error) {
    console.error('generateTrainingPlan error:', error.message);
    return Response.json({
      error: error.message || 'Unknown error',
      type: 'PLAN_GENERATION_ERROR'
    }, { status: 500 });
  }
});