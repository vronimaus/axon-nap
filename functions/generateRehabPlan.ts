import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { diagnosis_session_id } = await req.json();

    if (!diagnosis_session_id) {
      return Response.json({ error: 'diagnosis_session_id required' }, { status: 400 });
    }

    // Fetch diagnosis session
    let diagnosisSession;
    try {
      diagnosisSession = await base44.asServiceRole.entities.DiagnosisSession.filter(
        { id: diagnosis_session_id }
      );
      diagnosisSession = diagnosisSession[0];
    } catch {
      diagnosisSession = null;
    }

    if (!diagnosisSession) {
      return Response.json({ error: 'DiagnosisSession not found' }, { status: 404 });
    }

    // Fetch all exercises, routines and FAQs for matching
    const allExercises = await base44.entities.Exercise.list('-updated_date', 200);
    const allRoutines = await base44.entities.Routine.list('-updated_date', 100);
    const allFaqs = await base44.entities.FAQ.list('-updated_date', 100);

    // Prepare context for AI
    const exercisesContext = allExercises
      .map(e => `ID: ${e.exercise_id}, Name: ${e.name}, Category: ${e.category}, Difficulty: ${e.difficulty}`)
      .join('\n');

    const routinesContext = allRoutines
      .filter(r => r.published !== false)
      .map(r => `ID: ${r.id}, Name: ${r.routine_name}, Category: ${r.category}, Duration: ${r.total_duration}min, Description: ${r.description}`)
      .join('\n');

    const faqsContext = allFaqs
      .filter(f => f.published !== false)
      .map(f => `ID: ${f.faq_id}, Q: ${f.question}, Category: ${f.category}`)
      .join('\n');

    // Call LLM for plan generation
    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(id => id);
    const availableRoutineIds = allRoutines.slice(0, 5).map(r => r.id).filter(id => id);
    const availableFaqIds = allFaqs.slice(0, 5).map(f => f.faq_id).filter(id => id);

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a 3-phase rehab plan for: ${diagnosisSession.symptom_location} (${diagnosisSession.symptom_description}).

    Diagnosis Type: ${diagnosisSession.diagnosis_type}

    IMPORTANT: You MUST choose exercise IDs ONLY from this list:
    ${availableExerciseIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

    IMPORTANT: You MUST choose routine IDs ONLY from this list:
    ${availableRoutineIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

    IMPORTANT: You MUST choose FAQ IDs ONLY from this list:
    ${availableFaqIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

    Return JSON with:
    - phases: array of 3 objects (phase_number, title, description, duration_days, exercises array with ONLY exercise_id from list above, name, sets_reps_tempo, instruction, notes)
    - recommended_mfr_routines: array of 3 objects with ONLY routine_id (from list above), routine_name, reason
    - recommended_faqs: array of 3 objects with ONLY faq_id (from list above), question, reason`,
      response_json_schema: {
        type: 'object',
        properties: {
          phases: { 
            type: 'array',
            items: { type: 'object' }
          },
          recommended_mfr_routines: { 
            type: 'array',
            items: { type: 'object' }
          },
          recommended_faqs: { 
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    });

    // Validate response structure
    if (!planData.phases || !Array.isArray(planData.phases) || planData.phases.length === 0) {
      return Response.json({ 
        error: 'LLM response missing valid phases array' 
      }, { status: 502 });
    }

    // Validate referenced IDs exist
    const invalidRoutines = [];
    for (const routine of planData.recommended_mfr_routines || []) {
      const exists = allRoutines.find(r => r.id === routine.routine_id);
      if (!exists) invalidRoutines.push(routine.routine_id);
    }
    if (invalidRoutines.length > 0) {
      return Response.json({ 
        error: `Routines not found: ${invalidRoutines.join(', ')}` 
      }, { status: 400 });
    }

    const invalidFaqs = [];
    for (const faq of planData.recommended_faqs || []) {
      const exists = allFaqs.find(f => f.faq_id === faq.faq_id);
      if (!exists) invalidFaqs.push(faq.faq_id);
    }
    if (invalidFaqs.length > 0) {
      return Response.json({ 
        error: `FAQs not found: ${invalidFaqs.join(', ')}` 
      }, { status: 400 });
    }

    // Enrich phases with full Exercise details
    const enrichedPhases = await Promise.all(
      planData.phases.map(async (phase) => {
        const enrichedExercises = await Promise.all(
          phase.exercises.map(async (exercise) => {
            try {
              const fullExercise = await base44.entities.Exercise.filter(
                { exercise_id: exercise.exercise_id }
              );
              if (fullExercise.length > 0) {
                const ex = fullExercise[0];
                return {
                  ...exercise,
                  // Add rich details from Exercise entity
                  description: ex.description || exercise.instruction,
                  axon_moment: ex.axon_moment,
                  breathing_instruction: ex.breathing_instruction,
                  purpose_explanation: ex.purpose_explanation,
                  cues: ex.cues,
                  category: ex.category,
                  difficulty: ex.difficulty,
                  image_url: ex.image_url,
                  gif_url: ex.gif_url,
                  benefits: ex.benefits
                };
              }
              return exercise;
            } catch (e) {
              console.warn(`Could not enrich exercise ${exercise.exercise_id}:`, e);
              return exercise;
            }
          })
        );
        return { ...phase, exercises: enrichedExercises };
      })
    );

    // Create rehab plan
    const plan = await base44.entities.RehabPlan.create({
      user_email: user.email,
      diagnosis_session_id,
      problem_summary: `${diagnosisSession.symptom_location} - ${diagnosisSession.symptom_description}`,
      phases: enrichedPhases,
      recommended_mfr_routines: planData.recommended_mfr_routines,
      recommended_faqs: planData.recommended_faqs,
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      status: 'active'
    });

    return Response.json({ 
      success: true, 
      plan_id: plan.id,
      plan 
    });

  } catch (error) {
    console.error('generateRehabPlan error:', error);

    // Detailed error logging
    if (error.message.includes('JSON')) {
      return Response.json({ 
        error: 'LLM returned invalid JSON - plan generation failed' 
      }, { status: 502 });
    }

    return Response.json({ 
      error: error.message || 'Unknown error during plan generation',
      type: 'PLAN_GENERATION_ERROR'
    }, { status: 500 });
  }
});