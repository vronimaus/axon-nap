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

    // Fetch exercises by category directly (avoid loading all 500)
    const REHAB_PHASE1_CATS = ['mfr', 'neuro', 'breath', 'mobility'];
    const REHAB_PHASE2_CATS = ['core', 'plank', 'row'];
    const REHAB_PHASE3_CATS = ['pull', 'push', 'squat', 'hinge', 'carry'];

    const [
      phase1Exercises, phase2Exercises, phase3Exercises,
      allRoutines, allFaqs, allMFRNodes, allScenarios
    ] = await Promise.all([
      // Phase 1: mfr/neuro/breath/mobility – no limit, these are all gentle
      Promise.all(REHAB_PHASE1_CATS.map(cat =>
        base44.asServiceRole.entities.Exercise.filter({ category: cat }, '-updated_date', 40)
      )).then(results => results.flat()),
      // Phase 2: core/plank/row – beginner + intermediate only
      Promise.all(REHAB_PHASE2_CATS.map(cat =>
        base44.asServiceRole.entities.Exercise.filter({ category: cat }, '-updated_date', 20)
      )).then(results => results.flat()),
      // Phase 3: strength patterns – intermediate + advanced
      Promise.all(REHAB_PHASE3_CATS.map(cat =>
        base44.asServiceRole.entities.Exercise.filter({ category: cat }, '-updated_date', 20)
      )).then(results => results.flat()),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100),
      base44.asServiceRole.entities.MFRNode.list('-updated_date', 50),
      base44.asServiceRole.entities.AxonScenario.list('-updated_date', 50)
    ]);

    // Deduplicate and validate
    const dedup = (arr) => {
      const seen = new Set();
      return arr.filter(e => e.exercise_id && e.name && !seen.has(e.exercise_id) && seen.add(e.exercise_id));
    };

    const validPhase1 = dedup(phase1Exercises);
    const validPhase2 = dedup([...phase2Exercises, ...phase1Exercises.filter(e => e.category === 'mobility')]);
    const validPhase3 = dedup([...phase3Exercises, ...phase2Exercises]);
    const validExercises = dedup([...phase1Exercises, ...phase2Exercises, ...phase3Exercises]);

    console.log(`[generateRehabPlan] Loaded exercises: P1=${validPhase1.length}, P2=${validPhase2.length}, P3=${validPhase3.length} (total unique: ${validExercises.length})`);
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

    // Match AxonScenarios to region/problem via trigger_keywords and problem_category
    const matchedScenarios = allScenarios.filter(s => {
      const keywords = (s.trigger_keywords || []).map(k => k.toLowerCase());
      const regionWords = regionLower.split(/\s+/).filter(k => k.length > 3);
      return keywords.some(k => regionWords.some(rw => k.includes(rw) || rw.includes(k)));
    }).slice(0, 3);

    // Build scenario context block for the LLM
    const scenarioContext = matchedScenarios.length > 0
      ? matchedScenarios.map(s => `
--- AXON SCENARIO: ${s.problem_title} ---
NMS-Shift: ${s.nms_trigger_input || '?'} → ${s.nms_trigger_output || '?'}
MFR-Node: ${s.hardware_node} | Mechanismus: ${s.hardware_scientific_mechanism || s.hardware_description || '-'}
Neuro-Drill: ${s.software_drill} | Mechanismus: ${s.software_scientific_mechanism || s.software_description || '-'}
Integration: ${s.strength_exercise} | Mechanismus: ${s.strength_scientific_mechanism || s.strength_description || '-'}
Experten-Prinzip: ${s.expert_principle || '-'}
GESAMT-SYNERGIE: ${s.synergy_explanation || '-'}
Erwartete Outcomes: ${(s.expected_outcomes || []).join(' | ')}
Kontraindikationen: ${s.contraindications || 'keine bekannt'}
Protokoll: ${s.full_protocol || '-'}
`.trim()).join('\n\n')
      : 'Keine spezifischen AXON-Szenarien für diese Region gefunden – allgemeine AXON-Methodik anwenden.';

    console.log(`[generateRehabPlan] Matched AXON Scenarios: ${matchedScenarios.length} for region "${region}"`);

    // Use pre-loaded phase pools directly (already category-filtered from DB)
    const safePhase1 = validPhase1;
    const safePhase2 = validPhase2.filter(e => e.difficulty === 'beginner' || e.difficulty === 'intermediate');
    const safePhase3 = validPhase3.filter(e => e.difficulty === 'intermediate' || e.difficulty === 'advanced');

    console.log(`[generateRehabPlan] Phase pools ready: P1=${safePhase1.length}, P2=${safePhase2.length}, P3=${safePhase3.length}`);

    const buildCatalog = (pool) => pool.map(e => `ID: ${e.exercise_id} | Name: ${e.name} | Kat: ${e.category} | Diff: ${e.difficulty} | Zweck: ${(e.purpose_explanation || '-').substring(0, 80)}`).join('\n');
    const buildIdList = (pool) => pool.map(e => e.exercise_id).join('\n');

    // Build NMS shift context from matched scenario
    const primaryScenario = matchedScenarios[0];
    const nmsShiftContext = primaryScenario
      ? `NMS-SHIFT DIESES PLANS: ${primaryScenario.nms_trigger_input} → ${primaryScenario.nms_trigger_output}
WARUM Phase 1 (BECAUSE MFR): ${primaryScenario.hardware_scientific_mechanism || '-'}
WARUM Phase 2 (BECAUSE Neuro): ${primaryScenario.software_scientific_mechanism || '-'}  
WARUM Phase 3 (BECAUSE Integration): ${primaryScenario.strength_scientific_mechanism || '-'}
GESAMT-SYNERGIE: ${primaryScenario.synergy_explanation || '-'}`
      : '';

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein AXON Neuro-Athletic Protokoll Experte. Erstelle einen streng strukturierten 3-Phasen-Reha-Plan.

PROBLEM: ${problemDescription}
${extraContext ? 'KONTEXT:\n' + extraContext : ''}

===== AXON KAUSALITÄTSKETTE (NUTZE DIESE FÜR ERKLÄRUNGEN) =====
${scenarioContext}

${nmsShiftContext}

===== KRITISCHE PHASEN-REGELN (NICHT VERLETZBAR) =====

⚠️ PHASE 1 – NUR aus PHASE-1-ÜBUNGEN wählen (MFR, Neuro, Atemarbeit, sanfte Mobilität):
- KEINE Core-Übungen, KEINE Kraft, KEINE Planks, KEINE Hantelübungen, KEINE V-Sit, KEINE Kettlebell
- Nur: Atmung (breath), MFR/Faszienarbeit (mfr), Neuro-Drills (neuro), sanfte Mobilisation (mobility)
- PRIORITÄT: Wähle Übungen die direkt die betroffene Region (${region || problemDescription}) ansprechen
- Typisch für Phase 1: Zwerchfellatmung, MFR-Node-Release, Augenbewegungen, passive Dehnungen, Vagus-Aktivierung
- KEIN V-Sit, KEIN Ball-Exchange, KEINE koordinativen Kraft-Übungen

⚠️ PHASE 2 – Aus PHASE-2-ÜBUNGEN (Core, Stabilität, leichte Kraft):
- Aufbauend, aber noch kein hochintensives Training
- Typische Übungen: Bird Dog, Dead Bug, Wall Push-Up, Glute Bridge

⚠️ PHASE 3 – Aus PHASE-3-ÜBUNGEN (funktionelle Kraft, Integration, Performance):
- Anspruchsvolle, komplexe Bewegungen
- Deutlich schwerer als Phase 1 und 2

WEITERE REGELN:
1. Nur exercise_ids aus den jeweiligen IDs-Listen unten verwenden – exakt kopieren!
2. Jede Phase: 5-6 Übungen, VERSCHIEDENE von anderen Phasen
3. sets_reps_tempo konkret: z.B. "3×60s langsam", "2×10 tief einatmen", "4×8 kontrolliert"
4. nms_shift_explanation: Erkläre in 2-3 Sätzen was in DIESER Phase im Körper passiert (Mechanismus) und wohin sich der Zustand verschiebt. Nutze die AXON Kausalitätskette oben!
5. synergy_highlight: Erkläre in 1-2 Sätzen warum die Übungen DIESER Phase zusammen stärker wirken
6. phase_rationale: 1 Satz – warum diese Dauer

===== PHASE 1 ERLAUBTE IDs =====
${buildIdList(safePhase1)}

===== PHASE 1 ÜBUNGSKATALOG =====
${buildCatalog(safePhase1)}

===== PHASE 2 ERLAUBTE IDs =====
${buildIdList(safePhase2)}

===== PHASE 2 ÜBUNGSKATALOG =====
${buildCatalog(safePhase2)}

===== PHASE 3 ERLAUBTE IDs =====
${buildIdList(safePhase3)}

===== PHASE 3 ÜBUNGSKATALOG =====
${buildCatalog(safePhase3)}

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
                },
                phase_rationale: { type: 'string' },
                nms_shift_explanation: { type: 'string' },
                synergy_highlight: { type: 'string' }
              },
              required: ['phase_number', 'title', 'description', 'duration_days', 'exercises', 'phase_rationale', 'nms_shift_explanation']
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
              const fallbackPool = phase.phase_number === 1 ? safePhase1 : phase.phase_number === 2 ? safePhase2 : safePhase3;
              ex = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || validExercises[0];
              if (ex) console.log(`  → Using fallback: "${ex.exercise_id}" (${ex.name})`);
            }

            if (!ex) {
              console.error(`[generateRehabPlan] No valid exercise found for phase ${phase.phase_number}`);
              return null;
            }

            // Category enforcement: Phase 1 must ONLY be mfr/neuro/breath/mobility
            const allowedCats = phase.phase_number === 1 ? ['mfr', 'neuro', 'breath', 'mobility'] : null;
            if (allowedCats && !allowedCats.includes(ex.category)) {
              const replacement = safePhase1.find(p => !phase.exercises?.some(e2 => e2.exercise_id === p.exercise_id));
              if (replacement) {
                console.warn(`[generateRehabPlan] Phase 1 category violation: "${ex.exercise_id}" (${ex.category}) → replacing with "${replacement.exercise_id}" (${replacement.category})`);
                ex = replacement;
              }
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

        // Fallback: if LLM left nms_shift_explanation empty OR it's a generic/short text, use AxonScenario data
        let nmsExplanation = (phase.nms_shift_explanation || '').trim();
        let synergyHighlight = (phase.synergy_highlight || '').trim();

        // Always enrich with scenario data if available (even if LLM gave something, we prepend scenario mechanism)
        if (primaryScenario) {
          const mechanismByPhase = {
            1: primaryScenario.hardware_scientific_mechanism,
            2: primaryScenario.software_scientific_mechanism,
            3: primaryScenario.strength_scientific_mechanism
          };
          const scenarioMechanism = mechanismByPhase[phase.phase_number] || '';
          const nmsShift = `${primaryScenario.nms_trigger_input} → ${primaryScenario.nms_trigger_output}`;

          if (!nmsExplanation) {
            nmsExplanation = scenarioMechanism
              ? `${scenarioMechanism} (NMS-Shift: ${nmsShift})`
              : `NMS-Shift: ${nmsShift}`;
          } else if (nmsExplanation.length < 60) {
            // Too short – augment with scenario data
            nmsExplanation = `${nmsExplanation} ${scenarioMechanism ? '– ' + scenarioMechanism : ''} (${nmsShift})`.trim();
          }

          if (!synergyHighlight && primaryScenario.synergy_explanation) {
            synergyHighlight = primaryScenario.synergy_explanation;
          }
        }

        return { ...phase, exercises: enrichedExercises, nms_shift_explanation: nmsExplanation, synergy_highlight: synergyHighlight };
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
      matched_scenario_ids: matchedScenarios.map(s => s.scenario_id),
      nms_trigger_input: matchedScenarios[0]?.nms_trigger_input || null,
      nms_trigger_output: matchedScenarios[0]?.nms_trigger_output || null,
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