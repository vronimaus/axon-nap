import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      diagnosis_session_id,
      problem_summary,
      region,
      affected_chains,
      pain_intensity,
      feedback_summary
    } = body;

    // Optionally fetch diagnosis session if ID provided
    let diagnosisSession = null;
    if (diagnosis_session_id) {
      try {
        const sessions = await base44.asServiceRole.entities.DiagnosisSession.filter({ id: diagnosis_session_id });
        diagnosisSession = sessions[0] || null;
      } catch (_e) {
        diagnosisSession = null;
      }
    }

    // Build problem description from available data (safe regardless of diagnosisSession)
    const symptomLocation = diagnosisSession && diagnosisSession.symptom_location ? diagnosisSession.symptom_location : null;
    const symptomDescription = diagnosisSession && diagnosisSession.symptom_description ? diagnosisSession.symptom_description : null;

    const problemDescription = symptomLocation
      ? `${symptomLocation}${symptomDescription ? ' - ' + symptomDescription : ''}`
      : (problem_summary || region || 'Allgemeine Beschwerden');

    const diagnosisType = (diagnosisSession && diagnosisSession.diagnosis_type) ? diagnosisSession.diagnosis_type : 'mixed';

    const contextParts = [];
    if (affected_chains) contextParts.push(`Betroffene Faszien-Ketten: ${affected_chains}`);
    if (pain_intensity) contextParts.push(`Schmerzintensität: ${pain_intensity}/10`);
    if (feedback_summary) contextParts.push(`Feedback nach Übungen: ${feedback_summary}`);
    const extraContext = contextParts.join('\n');

    // Fetch exercises, routines, FAQs
    const [allExercises, allRoutines, allFaqs] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 200),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100)
    ]);

    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(Boolean);
    const availableRoutineIds = allRoutines.slice(0, 10).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 10).map(f => f.faq_id).filter(Boolean);

    // Build a rich exercise catalog so the LLM can pick based on real descriptions
    const exerciseCatalog = allExercises
      .filter(e => e.exercise_id)
      .map(e => `ID: ${e.exercise_id} | Name: ${e.name} | Kategorie: ${e.category || '-'} | Schwierigkeit: ${e.difficulty || '-'} | Zweck: ${e.purpose_explanation || e.description?.slice(0, 120) || '-'}`)
      .join('\n');

    console.log(`[generateRehabPlan] Problem: ${problemDescription}, Exercises: ${availableExerciseIds.length}, Routines: ${availableRoutineIds.length}`);

    // Build a simple list of valid IDs only (for strict selection)
    const validIdList = availableExerciseIds.join(', ');

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle einen 3-Phasen Rehabilitationsplan auf Deutsch.

Problem: ${problemDescription}
Diagnose-Typ: ${diagnosisType}
${extraContext}

KRITISCH - PFLICHTREGELN:
1. Du MUSST für jede Übung eine exercise_id aus der folgenden ERLAUBTEN ID-LISTE verwenden.
2. ERFINDE NIEMALS eigene exercise_ids. Nur IDs aus der ERLAUBTEN ID-LISTE sind gültig.
3. Jede Phase soll 4-6 Übungen enthalten.
4. Wähle die passendsten Übungen für das Problem aus.

ERLAUBTE exercise_ids (NUR diese verwenden!):
${validIdList}

ÜBUNGSKATALOG (Details zu den IDs):
${exerciseCatalog}

Phase 1 (Akut, 7 Tage): Schmerzlinderung, MFR, sanfte Mobilisation
Phase 2 (Aufbau, 14 Tage): Kräftigung, Stabilität, Bewegungsmuster  
Phase 3 (Integration, 14 Tage): Funktionelle Bewegung, Prävention

Verfügbare Routine-IDs (nur diese verwenden):
${availableRoutineIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}

Verfügbare FAQ-IDs (nur diese verwenden, falls vorhanden):
${availableFaqIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}`,
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
        required: ['phases', 'recommended_mfr_routines', 'recommended_faqs']
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

    // Build a lookup map for fast exercise enrichment
    const exerciseMap = {};
    allExercises.forEach(e => {
      if (e.exercise_id) exerciseMap[e.exercise_id] = e;
    });

    // Enrich exercises with DB data - skip exercises with invalid/missing IDs
    const enrichedPhases = planData.phases.map((phase) => {
      const enrichedExercises = (phase.exercises || [])
        .filter(exercise => {
          // Only keep exercises with a valid exercise_id from our catalog
          const isValid = exercise.exercise_id && exerciseMap[exercise.exercise_id];
          if (!isValid) {
            console.log(`[generateRehabPlan] Skipping exercise with invalid ID: "${exercise.exercise_id}" (${exercise.name})`);
          }
          return isValid;
        })
        .map(exercise => {
          const ex = exerciseMap[exercise.exercise_id];
          return {
            exercise_id: ex.exercise_id,
            name: ex.name,
            sets_reps_tempo: exercise.sets_reps_tempo,
            notes: exercise.notes,
            description: ex.description,
            axon_moment: ex.axon_moment,
            breathing_instruction: ex.breathing_instruction,
            purpose_explanation: ex.purpose_explanation,
            cues: ex.cues,
            category: ex.category,
            difficulty: ex.difficulty,
            image_url: ex.image_url,
            gif_url: ex.gif_url,
            benefits: ex.benefits,
            completed: false
          };
        });

      console.log(`[generateRehabPlan] Phase ${phase.phase_number}: ${enrichedExercises.length}/${(phase.exercises||[]).length} exercises valid`);
      return { ...phase, exercises: enrichedExercises };
    }).filter(phase => phase.exercises.length > 0); // Remove phases with no valid exercises

    if (enrichedPhases.length === 0) {
      return Response.json({ error: 'No valid exercises found from catalog - all LLM exercise_ids were invalid' }, { status: 502 });
    }

    const plan = await base44.asServiceRole.entities.RehabPlan.create({
      user_email: user.email,
      diagnosis_session_id: diagnosis_session_id || null,
      problem_summary: problemDescription,
      phases: enrichedPhases,
      recommended_mfr_routines: validRoutines,
      recommended_faqs: validFaqs,
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      status: 'active'
    });

    console.log(`[generateRehabPlan] Plan created: ${plan.id} with ${enrichedPhases.length} phases`);

    return Response.json({ success: true, plan_id: plan.id, plan });

  } catch (error) {
    console.error('generateRehabPlan error:', error.message);
    return Response.json({
      error: error.message || 'Unknown error',
      type: 'PLAN_GENERATION_ERROR'
    }, { status: 500 });
  }
});