import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { diagnosis_session_id, problem_summary, region, affected_chains, pain_intensity, feedback_summary } = body;

    // Support both: session-based OR direct input from agent
    let diagnosisSession = null;

    if (diagnosis_session_id) {
      try {
        const sessions = await base44.asServiceRole.entities.DiagnosisSession.filter({ id: diagnosis_session_id });
        diagnosisSession = sessions[0] || null;
      } catch {
        diagnosisSession = null;
      }
    }

    // Build problem description from available data
    const problemDescription = diagnosisSession
      ? `${diagnosisSession.symptom_location} - ${diagnosisSession.symptom_description}`
      : (problem_summary || region || 'Unbekanntes Problem');

    const diagnosisType = diagnosisSession?.diagnosis_type || 'mixed';
    const extraContext = [
      affected_chains ? `Betroffene Ketten: ${affected_chains}` : '',
      pain_intensity ? `Schmerzintensität: ${pain_intensity}/10` : '',
      feedback_summary ? `Feedback nach Übungen: ${feedback_summary}` : ''
    ].filter(Boolean).join('\n');

    // Fetch all exercises, routines and FAQs for matching
    const allExercises = await base44.asServiceRole.entities.Exercise.list('-updated_date', 200);
    const allRoutines = await base44.asServiceRole.entities.Routine.list('-updated_date', 100);
    const allFaqs = await base44.asServiceRole.entities.FAQ.list('-updated_date', 100);

    // Call LLM for plan generation
    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(id => id);
    const availableRoutineIds = allRoutines.slice(0, 5).map(r => r.id).filter(id => id);
    const availableFaqIds = allFaqs.slice(0, 5).map(f => f.faq_id).filter(id => id);

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle einen strukturierten 3-Phasen Reha-Plan für folgendes Problem:

Problem: ${problemDescription}
Diagnose-Typ: ${diagnosisType}
${extraContext}

Erstelle einen realistischen, detaillierten Plan. Jede Phase MUSS mindestens 3-5 Übungen enthalten.

Verfügbare Übungs-IDs (wähle NUR aus dieser Liste):
${availableExerciseIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

Verfügbare Routine-IDs:
${availableRoutineIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

Verfügbare FAQ-IDs:
${availableFaqIds.map((id, i) => `${i+1}. ${id}`).join('\n')}

WICHTIG: Gib für jede Übung konkrete Anweisungen auf Deutsch.
Phase 1 (Akut, 7 Tage): Schmerzlinderung, MFR, sanfte Mobilisation
Phase 2 (Aufbau, 14 Tage): Kräftigung, Stabilität, Bewegungsmuster
Phase 3 (Integration, 14 Tage): Funktionelle Bewegung, Prävention, Performance

Antworte mit JSON:
- phases: 3 Objekte mit phase_number, title, description, duration_days, exercises (mind. 3-5 Übungen mit exercise_id, name, sets_reps_tempo, instruction, notes)
- recommended_mfr_routines: 3 Objekte mit routine_id, routine_name, reason
- recommended_faqs: 3 Objekte mit faq_id, question, reason`,
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
                      instruction: { type: 'string' },
                      notes: { type: 'string' }
                    },
                    required: ['exercise_id', 'name', 'sets_reps_tempo', 'instruction', 'notes']
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
        required: ['phases', 'recommended_mfr_routines', 'recommended_faqs']
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