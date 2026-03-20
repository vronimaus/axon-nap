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

    // Fetch exercises, routines, FAQs, and MFR Nodes
    const [allExercises, allRoutines, allFaqs, allNodes] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 300),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100),
      base44.asServiceRole.entities.MFRNode.list('order', 20)
    ]);

    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(Boolean);

    // Format Nodes for Context
    const nodeContext = allNodes.map(n => `${n.node_id}: ${n.name_de} (${n.body_area})`).join('\n');
    const availableRoutineIds = allRoutines.slice(0, 10).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 10).map(f => f.faq_id).filter(Boolean);

    // Build compact exercise catalog — only EXACT IDs from DB
    const validExercises = allExercises.filter(e => e.exercise_id);
    const exerciseCatalog = validExercises
      .map(e => {
        const tags = [e.category, e.difficulty].filter(Boolean).join('|');
        const goals = (e.related_performance_goals || []).slice(0, 3).join(',');
        const mechanics = (e.mechanical_impact_type || []).join(',');
        return `${e.exercise_id}: "${e.name}" [${tags}]${goals ? ' Ziele:' + goals : ''}${mechanics ? ' Mech:' + mechanics : ''}`;
      })
      .join('\n');

    // Explicit ID-only list to reinforce constraint
    const exactIdList = validExercises.map(e => e.exercise_id).join('\n');

    console.log(`[generateTrainingPlan] Goal: ${goal_description}, Exercises: ${availableExerciseIds.length}`);

    // Build exercise lookup for enrichment
    const exerciseLookup = {};
    for (const ex of allExercises) {
      if (ex.exercise_id) exerciseLookup[ex.exercise_id] = ex;
    }

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist AXON V2, ein Elite-Neuro-Athletik-System. Erstelle einen "Fluid Logic" Trainingsplan basierend auf Stecco-Faszien-Mechanik.

    PROFIL:
    Ziel: "${goal_description}"
    Baseline: ${baseline || 'Nicht angegeben'}
    Assessment: ${baselineData || 'Kein Assessment'}
    Level: ${activityLvl}, XP: ${expLvl}
    Sport: ${sport || 'Keiner'}

    ════════════════════════════════════════════
    AXON FLUID LOGIC (V2) STRUKTUR
    ════════════════════════════════════════════
    Erstelle 3 progressive Phasen (Foundation, Development, Mastery).
    JEDE Phase repräsentiert eine komplette SESSION-Struktur und MUSS 7-10 Übungen enthalten, strikt unterteilt in diese 4 Blöcke:

    1. NEURO-PRIMER (1-2 Übungen)
    - Ziel: Input für das Gehirn (Vision, Vestibular, Atmung).
    - Typ: 'neuro', 'breath', 'mobility' (Hals/Nacken).

    2. SLING-ACTIVATION (2-3 Übungen)
    - Ziel: Fasziale Ketten "aufwecken" & Gelenk-Vorbereitung.
    - Typ: 'mobility', 'mfr', 'core', 'plank'.
    - Fokus auf Stecco-Nodes N1-N12.

    3. PERFORMANCE-BLOCK (3-4 Übungen)
    - Ziel: Der Hauptreiz (Kraft, Skill, Power).
    - Typ: 'strength', 'explosive', 'squat', 'hinge', 'push', 'pull'.
    - Progression über die 3 Phasen (Iso -> Exzentrik -> Dynamik).

    4. RESILIENCE / COOL-DOWN (1-2 Übungen)
    - Ziel: De-Tonisierung & Integration.
    - Typ: 'breath', 'mfr', 'flow'.

    ════════════════════════════════════════════
    STECCO NODE MAPPING (Verwende diese IDs für 'target_nodes')
    ════════════════════════════════════════════
    ${nodeContext}

    ════════════════════════════════════════════
    REGELN
    ════════════════════════════════════════════
    - Wähle Übungen, die mechanisch und neurologisch Sinn ergeben.
    - 'intensity_factor': 1.0 (Neuro/Rehab) bis 3.0 (Max Power).
    - 'sling_id': anterior, posterior, lateral, deep_frontal.
    - KRITISCH: Nutze AUSSCHLIESSLICH exercise_ids aus der ERLAUBTEN ID-LISTE. Jede andere ID ist ein fataler Fehler.
    - Schreibe NIEMALS Übungsnamen als exercise_id – nur exakte IDs aus der Liste unten.

    ===== ERLAUBTE EXERCISE_IDs – NUR DIESE VERWENDEN =====
    ${exactIdList}

    VERFÜGBARE ÜBUNGEN (Details zu den IDs oben):
    ${exerciseCatalog}

    Verfügbare Routinen:
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
                      section: { type: 'string', enum: ['neuro_primer', 'sling_activation', 'performance', 'resilience'] },
                      intensity_factor: { type: 'number' },
                      sling_id: { type: 'string' },
                      target_nodes: { type: 'array', items: { type: 'string' } },
                      rehab_proxy: { type: 'string' }
                    },
                    required: ['exercise_id', 'name', 'sets_reps_tempo', 'instruction', 'section']
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