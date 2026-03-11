import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnosis_session_id, problem_summary, region, pain_intensity } = body;

    // Build problem description
    let diagnosisSession = null;
    if (diagnosis_session_id) {
      try {
        const sessions = await base44.asServiceRole.entities.DiagnosisSession.filter({ id: diagnosis_session_id });
        diagnosisSession = sessions[0] || null;
      } catch (_e) { /* non-blocking */ }
    }

    const problemDescription = diagnosisSession?.symptom_location
      ? `${diagnosisSession.symptom_location}${diagnosisSession.symptom_description ? ' - ' + diagnosisSession.symptom_description : ''}`
      : (problem_summary || region || 'Allgemeine Beschwerden');

    // Fetch neuro profile for context
    let neuroProfile = null;
    try {
      const profiles = await base44.asServiceRole.entities.UserNeuroProfile.filter({ user_email: user.email });
      neuroProfile = profiles[0] || null;
    } catch (_e) { /* non-blocking */ }

    // Fetch MINIMAL exercise set — max 60, only essential fields
    const allExercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 60);
    const validExercises = allExercises.filter(e => e.exercise_id && e.name);

    // Split into phase pools by difficulty
    const beginnerEx = validExercises.filter(e => e.difficulty === 'beginner').slice(0, 12);
    const intermediateEx = validExercises.filter(e => e.difficulty === 'intermediate').slice(0, 12);
    const advancedEx = validExercises.filter(e => e.difficulty === 'advanced').slice(0, 8);
    const exercisePool = [...beginnerEx, ...intermediateEx, ...advancedEx];

    // Compact catalog — only ID, name, difficulty, category for LLM
    const exerciseCatalog = exercisePool
      .map(e => `${e.exercise_id} | ${e.name} | ${e.difficulty || '?'} | ${e.category || '?'}`)
      .join('\n');

    // Extra user context (compact)
    const contextParts = [];
    if (pain_intensity) contextParts.push(`Schmerzintensität: ${pain_intensity}/10`);
    if (neuroProfile?.activity_level) contextParts.push(`Aktivitätslevel: ${neuroProfile.activity_level}`);
    if (neuroProfile?.training_experience) contextParts.push(`Erfahrung: ${neuroProfile.training_experience}`);
    if (neuroProfile?.injury_history_major) contextParts.push(`Verletzungen: ${neuroProfile.injury_history_major}`);
    const extraContext = contextParts.join(' | ');

    console.log(`[generateRehabPlan] Problem: "${problemDescription}" | Pool: ${exercisePool.length} exercises`);

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein AXON Neuro-Athletik Experte. Erstelle einen 3-Phasen Rehab-Plan.

PROBLEM: ${problemDescription}
${extraContext ? 'KONTEXT: ' + extraContext : ''}

REGELN:
- Verwende NUR exercise_ids aus dem KATALOG unten (EXAKT kopieren)
- Phase 1: 4-5 beginner Übungen (neuro, breath, mfr, mobility)
- Phase 2: 4-5 intermediate Übungen (core, mobility, stability)  
- Phase 3: 4-5 intermediate/advanced Übungen (strength, functional)
- sets_reps_tempo konkret: z.B. "3×10 langsam", "2×60 Sek.", "4×8"
- notes: kurze AXON-Coaching-Cue was der User spüren soll

ÜBUNGSKATALOG (ID | Name | Schwierigkeit | Kategorie):
${exerciseCatalog}`,
      response_json_schema: {
        type: 'object',
        properties: {
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
        required: ['phases']
      }
    });

    if (!planData?.phases?.length) {
      return Response.json({ error: 'LLM returned no phases' }, { status: 502 });
    }

    // Enrich exercises from DB golden source
    const exerciseIdMap = Object.fromEntries(validExercises.map(e => [e.exercise_id, e]));
    const hallucinations = [];

    const enrichedPhases = planData.phases.map(phase => {
      const enrichedExercises = (phase.exercises || []).map(ex => {
        let dbEx = exerciseIdMap[ex.exercise_id];
        if (!dbEx) {
          hallucinations.push(ex.exercise_id);
          // Fallback: pick by phase difficulty
          const difficulty = phase.phase_number === 1 ? 'beginner' : phase.phase_number === 2 ? 'intermediate' : 'advanced';
          dbEx = validExercises.find(e => e.difficulty === difficulty) || validExercises[0];
        }
        if (!dbEx) return null;
        return {
          exercise_id: dbEx.exercise_id,
          name: dbEx.name,
          sets_reps_tempo: ex.sets_reps_tempo,
          notes: ex.notes || dbEx.axon_moment || null,
          instruction: dbEx.description || null,
          axon_moment: dbEx.axon_moment || null,
          breathing_instruction: dbEx.breathing_instruction || null,
          purpose_explanation: dbEx.purpose_explanation || null,
          goal_explanation: dbEx.goal_explanation || null,
          benefits: dbEx.benefits || null,
          cues: dbEx.cues || [],
          category: dbEx.category || null,
          difficulty: dbEx.difficulty || null,
          image_url: dbEx.image_url || null,
          gif_url: dbEx.gif_url || null,
          progression_basic: dbEx.progression_basic || null,
          progression_advanced: dbEx.progression_advanced || null,
          modification_suggestions_yellow: dbEx.modification_suggestions_yellow || null,
          modification_suggestions_red: dbEx.modification_suggestions_red || null,
          completed: false
        };
      }).filter(Boolean);

      return { ...phase, exercises: enrichedExercises };
    }).filter(p => p.exercises.length > 0);

    if (hallucinations.length > 0) {
      console.warn(`[generateRehabPlan] ${hallucinations.length} hallucinations replaced:`, hallucinations);
    }

    if (enrichedPhases.length === 0) {
      return Response.json({ error: 'No valid exercises generated' }, { status: 502 });
    }

    // Save plan using service role to bypass RLS
    const plan = await base44.asServiceRole.entities.RehabPlan.create({
      user_email: user.email,
      diagnosis_session_id: diagnosis_session_id || null,
      problem_summary: problemDescription,
      phases: enrichedPhases,
      recommended_mfr_routines: [],
      recommended_faqs: [],
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      status: 'active',
      session_status: 'active',
      current_exercise_substituted: false,
      substituted_exercise_id: null,
      pain_feedback_node: null,
      pain_nrs: null,
      intervention_mode: 'none',
      live_adjust_log: [],
      feedback_history: []
    });

    console.log(`[generateRehabPlan] Plan created: ${plan.id}`);
    return Response.json({ success: true, plan_id: plan.id, plan });

  } catch (error) {
    console.error('[generateRehabPlan] Error:', error.message);
    return Response.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
});