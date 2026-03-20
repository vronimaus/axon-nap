import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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

    // Build compact exercise catalog — smart-filter to max 80 relevant exercises
    const validExercises = allExercises.filter(e => e.exercise_id);

    // Determine performance orientation from goal + level
    const isPerformanceGoal = ['advanced', 'elite', 'athlete'].includes(expLvl) ||
      ['very_active', 'athlete'].includes(activityLvl) ||
      /burpee|pull.?up|push.?up|squat|sprint|jump|planche|muscle.?up|handstand|pistol|dip|carry|deadlift|bench|press|power|strength|performance|100|50|max/i.test(goal_description);

    // Score exercises by relevance to goal_description + user level
    const goalLower = (goal_description + ' ' + expLvl + ' ' + sport).toLowerCase();
    const scored = validExercises.map(e => {
      let score = 0;
      const text = [e.name, e.category, e.difficulty, (e.related_performance_goals || []).join(' '), (e.mechanical_impact_type || []).join(' ')].join(' ').toLowerCase();
      // Boost if goal keywords match
      const keywords = goalLower.split(/\s+/).filter(w => w.length > 3);
      for (const kw of keywords) { if (text.includes(kw)) score += 3; }
      // Boost by difficulty match
      if (e.difficulty === 'intermediate' && (expLvl === 'intermediate')) score += 3;
      if (e.difficulty === 'advanced' && (expLvl === 'advanced' || expLvl === 'elite')) score += 5;
      if (e.difficulty === 'beginner' && expLvl === 'beginner') score += 3;

      if (isPerformanceGoal) {
        // Performance-focused: heavily favor strength, power, conditioning exercises
        if (['push', 'pull', 'squat', 'hinge', 'carry', 'dip', 'row', 'core', 'plank'].includes(e.category)) score += 4;
        if (['explosive'].includes(e.category)) score += 5;
        if ((e.mechanical_impact_type || []).includes('strength')) score += 3;
        if ((e.mechanical_impact_type || []).includes('explosive')) score += 4;
        // Neuro/Breath still needed but reduced priority
        if (['neuro', 'breath'].includes(e.category)) score += 1;
        if (['mobility', 'mfr'].includes(e.category)) score += 1;
      } else {
        // Balanced: equal weight for all categories
        if (['neuro', 'breath'].includes(e.category)) score += 2;
        if (['mobility', 'mfr'].includes(e.category)) score += 2;
        if (['push', 'pull', 'squat', 'hinge'].includes(e.category)) score += 2;
      }
      return { ex: e, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const filteredExercises = scored.slice(0, 50).map(s => s.ex);

    const exerciseCatalog = filteredExercises
      .map(e => {
        const tags = [e.category, e.difficulty].filter(Boolean).join('|');
        return `${e.exercise_id}: "${e.name}" [${tags}]`;
      })
      .join('\n');

    // ID-only list for strict constraint (only filtered ones in prompt)
    const exactIdList = filteredExercises.map(e => e.exercise_id).join(', ');

    console.log(`[generateTrainingPlan] Goal: "${goal_description}" | Mode: ${isPerformanceGoal ? '⚡ PERFORMANCE (claude_sonnet_4_6)' : 'BALANCED (default)'} | Level: ${expLvl}/${activityLvl} | Exercises: ${validExercises.length} → filtered: ${filteredExercises.length}`);

    // Build exercise lookup for enrichment
    const exerciseLookup = {};
    for (const ex of allExercises) {
      if (ex.exercise_id) exerciseLookup[ex.exercise_id] = ex;
    }

    // Choose model and build mode-specific prompt context
    const llmModel = isPerformanceGoal ? 'claude_sonnet_4_6' : undefined;

    const performancePromptSection = isPerformanceGoal ? `
    ════════════════════════════════════════════
    PERFORMANCE-ATHLETIK MODUS — KEIN SANFTER EINSTIEG
    ════════════════════════════════════════════
    Dieser User ist ${expLvl}/${activityLvl} und will "${goal_description}".
    Das ist ein konkretes, anspruchsvolles Performance-Ziel. Behandle ihn wie einen Athleten.

    DENKWEISE: Was würde ein S&C-Coach aus dem Profi-Sport für dieses Ziel programmieren?
    - Direkte Übertragung: Wähle Übungen, die EXAKT die Muskeln/Muster für das Ziel trainieren
    - Progressive Überlastung: Jede Phase erhöht Volumen ODER Intensität, nicht beides gleichzeitig
    - Phase 1 (Foundation): Volumen-Aufbau, technische Basis, 4x8-12 oder 5x5
    - Phase 2 (Intensität): Schwerere Loads / mehr Schwierigkeit, 4x5-8 oder EMOM/AMRAP
    - Phase 3 (Peak): Maximale Intensität, Skill-Transfer, 3x3-5 oder Max-Set-Protokolle

    PERFORMANCE-BLOCK (4-6 Übungen) — DAS IST DER PLAN:
    - Direkte Ziel-Übungen zuerst (z.B. bei Burpees: Burpee-Varianten, Push-ups, Squat-Jumps, Core)
    - sets_reps_tempo für ${expLvl}:
      * intermediate: 4x8, 5x5, 3x10, EMOM 10min
      * advanced: 5x5, 4x6, AMRAP, Superset-Protokolle, Max-Sets
      * elite: 6x3, Wave-Loading, Cluster-Sets, Sport-spezifische Circuits
    - intensity_factor: Phase 1 = 2.0, Phase 2 = 2.5, Phase 3 = 3.0
    - Keine "leichten" Einstiegsübungen im Performance-Block

    NEURO-PRIMER (NUR 1 Übung — kurz und zweckgebunden):
    - Maximal 1 Übung zur neuronalen Vorbereitung, die DIREKT das Ziel-Muster aktiviert
    - Nicht: allgemeine Atemübungen oder generischer Neuro-Kram
    - Ja: etwas das die CNS für die kommende Belastung schärft

    SLING-ACTIVATION (2-3 Übungen — zielspezifisch):
    - Aktiviere die faszialen Ketten, die für das Ziel gebraucht werden
    - Kein generisches Mobility-Programm — gezielt auf den Performance-Block vorbereiten
    ` : `
    ════════════════════════════════════════════
    AXON FLUID LOGIC (V2) STRUKTUR — BALANCED
    ════════════════════════════════════════════
    Erstelle 3 progressive Phasen (Foundation, Development, Mastery).

    1. NEURO-PRIMER (1-2 Übungen): Vision, Vestibular, Atmung
    2. SLING-ACTIVATION (2-3 Übungen): Fasziale Ketten, MFR, Gelenk-Prep
    3. PERFORMANCE-BLOCK (3-4 Übungen): Hauptreiz, Kraft/Skill/Power
       - intensity_factor: Phase 1 = 1.5, Phase 2 = 2.0, Phase 3 = 2.5
    4. RESILIENCE (1-2 Übungen): De-Tonisierung, Integration
    `;

    const planData = await base44.integrations.Core.InvokeLLM({
      ...(llmModel ? { model: llmModel } : {}),
      prompt: `Du bist AXON V2, ein Elite-Neuro-Athletik-Coach-System.

    PROFIL:
    Ziel: "${goal_description}"
    Baseline: ${baseline || 'Nicht angegeben'}
    Assessment: ${baselineData || 'Kein Assessment'}
    Fitness-Level: ${activityLvl} | Trainingserfahrung: ${expLvl}
    Sport: ${sport || 'Keiner'}
    ${performancePromptSection}

    ════════════════════════════════════════════
    ALLGEMEINE REGELN (für beide Modi)
    ════════════════════════════════════════════
    Erstelle 3 progressive Phasen. JEDE Phase = komplette SESSION-Struktur mit den 4 Blöcken:
    section-Werte: "neuro_primer" | "sling_activation" | "performance" | "resilience"

    STECCO NODE MAPPING (für 'target_nodes'):
    ${nodeContext}

    KRITISCHE PFLICHT-REGELN:
    - 'sling_id': anterior | posterior | lateral | deep_frontal
    - 'intensity_factor': 1.0 (Neuro/leicht) bis 3.0 (Max Power)
    - FATAL ERROR wenn exercise_id nicht exakt aus der Liste unten stammt
    - NIEMALS Übungsnamen als exercise_id schreiben

    ===== ERLAUBTE EXERCISE_IDs – NUR DIESE =====
    ${exactIdList}

    ÜBUNGS-DETAILS:
    ${exerciseCatalog}

    Routinen: ${availableRoutineIds.join(', ')}
    FAQs: ${availableFaqIds.join(', ')}`,
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
              instruction: dbEx.description || dbEx.instruction || exercise.instruction,
              description: dbEx.description || exercise.instruction,
              axon_moment: dbEx.axon_moment || exercise.notes,
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