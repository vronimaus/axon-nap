import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
    // Smart filtering: exercises matching target slings OR region keywords in category/description
    const regionKeywords = regionLower.split(/\s+/).filter(k => k.length > 3);
    const smartFilteredExercises = validExercises.filter(e => {
      if (!targetSlings.length) return true;
      const primarySling = (e.smart_tags?.kinetic_chain_slings?.primary_sling || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      const purpose = (e.purpose_explanation || '').toLowerCase();
      const slingsMatch = targetSlings.some(sling => primarySling.includes(sling));
      const regionMatch = regionKeywords.some(k => category.includes(k) || purpose.includes(k));
      return slingsMatch || regionMatch;
    });

    // Phase-buckets: always include beginner/intermediate/advanced to cover all 3 phases
    const beginnerEx = validExercises.filter(e => e.difficulty === 'beginner').slice(0, 20);
    const intermediateEx = validExercises.filter(e => e.difficulty === 'intermediate').slice(0, 20);
    const advancedEx = validExercises.filter(e => e.difficulty === 'advanced').slice(0, 15);

    // Build best set: smart-filtered + phase-buckets, capped at 80
    const smartSet = smartFilteredExercises.slice(0, 45);
    const allIds = new Set(smartSet.map(e => e.exercise_id));
    const phasePool = [...beginnerEx, ...intermediateEx, ...advancedEx].filter(e => !allIds.has(e.exercise_id));
    const bestExercises = [...smartSet, ...phasePool].slice(0, 80);

    console.log(`[generateRehabPlan] Exercise pool: ${bestExercises.length} (smart:${smartSet.length} + phase-pool:${phasePool.length})`);

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
      prompt: `Du bist ein Experte für neuro-athletische Rehabilitation (AXON-Methode). Erstelle einen hochwertig personalisierten 3-Phasen-Reha-Plan.

PROBLEM DES NUTZERS:
${problemDescription}
${extraContext ? '\nNUTZERKONTEXT:\n' + extraContext : ''}

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

PHASE 1 – "RELEASE & CALM" (Akut-Phase):
→ Ziel: Schmerzlinderung, parasympathische Aktivierung, MFR, Atemarbeit
→ Nur beginner-Übungen: Kategorie neuro, breath, mfr, mobility
→ Sanft: Kein Kraft, kein Impuls
→ duration_days: Bestimme EHRLICH basierend auf Schmerzintensität. Bei leicht (1-3): 3 Tage. Bei mittel (4-6): 5 Tage. Bei stark (7-10): 7 Tage.
→ phase_rationale: Erkläre KURZ warum du genau diese Dauer gewählt hast (1 Satz).

PHASE 2 – "BUILD & STABILIZE" (Aufbau-Phase):
→ Ziel: Kräftigung, Stabilität, Bewegungsmuster neu lernen
→ intermediate-Übungen: Kategorie core, mobility, plank, row, pull, push
→ ANDERE Übungen als Phase 1 – Progression!
→ duration_days: Typisch 7-10 Tage. Abhängig von Komplexität der Region und Phase 1 Dauer.
→ phase_rationale: Erkläre KURZ warum du genau diese Dauer gewählt hast.

PHASE 3 – "INTEGRATE & PERFORM" (Performance-Phase):
→ Ziel: Funktionelle Bewegung, Alltagsintegration, Prävention, Performance
→ intermediate/advanced: Komplexe Bewegungen, Kraft + Neuro kombiniert
→ ANDERE Übungen als Phase 1 & 2 – deutlicher Schwierigkeitssprung
→ duration_days: Typisch 7-14 Tage. Wähle konservativ wenn Phase 1/2 kurz waren.
→ phase_rationale: Erkläre KURZ warum du genau diese Dauer gewählt hast.

===== ÜBUNGSKATALOG (ALLE IDs sind real – EXAKT so übernehmen) =====
${exerciseCatalog}

===== VERFÜGBARE ROUTINE-IDs =====
${availableRoutineIds.join(', ')}

===== VERFÜGBARE FAQ-IDs =====
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

    const enrichedPhases = (await Promise.all(
      planData.phases.map(async (phase) => {
        const enrichedExercises = (await Promise.all(
          (phase.exercises || []).map(async (exercise) => {
            const requestedId = exercise.exercise_id;
            let ex = exerciseIdMap[requestedId];

            if (!ex) {
              hallucinations.push(requestedId);
              console.warn(`[generateRehabPlan] HALLUCINATION: "${requestedId}" not in Golden Source`);
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
        )).filter(ex => ex !== null);

        console.log(`[generateRehabPlan] Phase ${phase.phase_number}: ${enrichedExercises.length}/${(phase.exercises||[]).length} valid`);
        return { ...phase, exercises: enrichedExercises };
      })
    )).filter(phase => phase.exercises.length > 0);

    if (hallucinations.length > 0) {
      console.error(`[generateRehabPlan] HALLUCINATION REPORT: ${hallucinations.length} invalid IDs:`, hallucinations);
    }

    if (enrichedPhases.length === 0) {
      return Response.json({ error: 'No valid exercises generated', hallucinations }, { status: 502 });
    }

    const plan = await base44.entities.RehabPlan.create({
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