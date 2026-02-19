import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('[generateRehabPlan] JSON parse error:', e.message);
      return Response.json({ error: 'Invalid JSON in request body', details: e.message }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    // Fetch UserNeuroProfile for richer context
    let neuroProfile = null;
    try {
      const profiles = await base44.asServiceRole.entities.UserNeuroProfile.filter({ user_email: user.email });
      neuroProfile = profiles[0] || null;
    } catch (_e) { /* non-blocking */ }

    const contextParts = [];
    if (affected_chains) contextParts.push(`Betroffene Faszien-Ketten: ${affected_chains}`);
    if (pain_intensity) contextParts.push(`Schmerzintensität: ${pain_intensity}/10`);
    if (feedback_summary) contextParts.push(`Feedback nach Übungen: ${feedback_summary}`);
    if (neuroProfile) {
      if (neuroProfile.activity_level) contextParts.push(`Aktivitätslevel: ${neuroProfile.activity_level}`);
      if (neuroProfile.training_experience) contextParts.push(`Trainingserfahrung: ${neuroProfile.training_experience}`);
      if (neuroProfile.fitness_goals?.length) contextParts.push(`Fitnessziele: ${neuroProfile.fitness_goals.join(', ')}`);
      if (neuroProfile.injury_history_major) contextParts.push(`Verletzungshistorie: ${neuroProfile.injury_history_major}`);
      if (neuroProfile.primary_posture) contextParts.push(`Haltung im Alltag: ${neuroProfile.primary_posture}`);
      if (neuroProfile.complaint_history?.length) {
        const activeComplaints = neuroProfile.complaint_history.filter(c => c.status === 'active');
        if (activeComplaints.length) contextParts.push(`Weitere aktive Beschwerden: ${activeComplaints.map(c => c.location).join(', ')}`);
      }
    }
    const extraContext = contextParts.join('\n');

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

    // GOLDEN SOURCE: Map region/problem to MFRNodes and extract target chains/slings
    const regionLower = (region || problemDescription || '').toLowerCase();
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

    console.log(`[generateRehabPlan] Region "${region}" → MFR Nodes: ${relevantMFRNodes.length}, Target Slings: [${targetSlings.join(', ')}]`);

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

    console.log(`[generateRehabPlan] Filtered exercises: ${bestExercises.length}/${validExercises.length}`);

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein erfahrener Reha-Therapeut und erstellst einen personalisierten 3-Phasen-Rehabilitationsplan.

PROBLEM DES NUTZERS:
${problemDescription}
${extraContext ? '\nNUTZERKONTEXT:\n' + extraContext : ''}

TARGET FASCIA CHAINS (GOLDEN SOURCE - aus Schmerzregion erkannt):
Zielketten: ${targetSlings.length > 0 ? targetSlings.join(', ') : 'alle Ketten'}

=== PFLICHTREGELN (ABSOLUT ZWINGEND) ===
1. Du MUSST ausschließlich exercise_ids aus dem ÜBUNGSKATALOG unten verwenden.
2. ERFINDE NIEMALS exercise_ids. Kopiere sie EXAKT so wie sie im Katalog stehen (z.B. "KB_GEN_005" nicht "KB_general_5").
3. Priorisiere Übungen mit "Sling: ${targetSlings[0] || 'posterior'}" wenn möglich.
4. Jede Phase MUSS 5-7 verschiedene Übungen enthalten.
5. Wähle Übungen die thematisch zum Problem passen (Kategorie, Schwierigkeit, Sling).
6. Verteile die Schwierigkeiten sinnvoll: Phase 1 = beginner, Phase 2 = intermediate, Phase 3 = advanced/intermediate.
7. Das Feld "sets_reps_tempo" muss konkret sein (z.B. "3x12 langsam und kontrolliert", "2x45 Sek. halten").
8. Das Feld "notes" muss den AXON-Moment beschreiben: was soll der Nutzer spüren/lernen?

PHASEN-STRUKTUR:
- Phase 1 (Akut, 7 Tage): Schmerzlinderung, MFR, sanfte Mobilisation – nur beginner/leichte Übungen
- Phase 2 (Aufbau, 14 Tage): Kräftigung, Stabilität, Bewegungsmuster – intermediate
- Phase 3 (Integration, 14 Tage): Funktionelle Bewegung, Prävention, Performance – intermediate/advanced

=== ÜBUNGSKATALOG (NUR diese IDs sind erlaubt - ALLE sind REAL und GETESTET) ===
${exerciseCatalog}

=== VERFÜGBARE ROUTINE-IDs ===
${availableRoutineIds.join(', ')}

=== VERFÜGBARE FAQ-IDs ===
${availableFaqIds.join(', ')}`,
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

    // STRICT VALIDATION: Golden Source mapping (exercise_id → DB object)
    const exerciseIdMap = Object.fromEntries(validExercises.map(e => [e.exercise_id, e]));
    const hallucinations = [];

    const enrichedPhases = await Promise.all(
      planData.phases.map(async (phase) => {
        const enrichedExercises = await Promise.all(
          (phase.exercises || []).map(async (exercise) => {
            const requestedId = exercise.exercise_id;
            let ex = exerciseIdMap[requestedId];

            // If not found, log hallucination and use fallback
            if (!ex) {
              hallucinations.push(requestedId);
              console.warn(`[generateRehabPlan] HALLUCINATION: "${requestedId}" not in Golden Source`);
              
              // Fallback: use random valid exercise matching phase difficulty
              ex = validExercises.find(e => {
                if (phase.phase_number === 1) return e.difficulty === 'beginner';
                if (phase.phase_number === 2) return e.difficulty === 'intermediate';
                return e.difficulty === 'advanced' || e.difficulty === 'intermediate';
              }) || validExercises[Math.floor(Math.random() * validExercises.length)];
              
              if (ex) console.log(`  → Using fallback: "${ex.exercise_id}" (${ex.name})`);
            }

            if (!ex) {
              console.error(`[generateRehabPlan] No valid exercise found for phase ${phase.phase_number}`);
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
        );
        
        const validPhaseExercises = enrichedExercises.filter(ex => ex !== null);
        console.log(`[generateRehabPlan] Phase ${phase.phase_number}: ${validPhaseExercises.length}/${(phase.exercises||[]).length} valid`);
        return { ...phase, exercises: validPhaseExercises };
      })
    ).then(phases => phases.filter(phase => phase.exercises.length > 0));

    if (hallucinations.length > 0) {
      console.error(`[generateRehabPlan] HALLUCINATION REPORT: ${hallucinations.length} invalid IDs:`, hallucinations);
    }

    if (enrichedPhases.length === 0) {
      return Response.json({ error: 'No valid exercises generated', hallucinations }, { status: 502 });
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
      status: 'active',
      // Initialize new "Ouch!" scenario fields
      session_status: 'active',
      current_exercise_substituted: false,
      substituted_exercise_id: null,
      pain_feedback_node: null,
      pain_nrs: null,
      intervention_mode: 'none',
      live_adjust_log: [],
      feedback_history: []
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