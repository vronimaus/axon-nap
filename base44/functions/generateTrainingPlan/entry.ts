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
    const nodeContext = allNodes.slice(0, 12).map(n => `${n.node_id}: ${n.name_de}`).join(', ');
    const availableRoutineIds = allRoutines.slice(0, 5).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 5).map(f => f.faq_id).filter(Boolean);

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

    console.log(`[generateTrainingPlan] Goal: "${goal_description}" | Mode: ${isPerformanceGoal ? '⚡ PERFORMANCE' : 'BALANCED'} | Level: ${expLvl}/${activityLvl} | Exercises: ${validExercises.length} → filtered: ${filteredExercises.length}`);

    // Build exercise lookup for enrichment
    const exerciseLookup = {};
    for (const ex of allExercises) {
      if (ex.exercise_id) exerciseLookup[ex.exercise_id] = ex;
    }

    // Choose model and build mode-specific prompt context
    // Use default model — heavy models (gpt_5, claude) exceed Deno Deploy's CPU/time limits
    const llmModel = undefined;

    const performancePromptSection = isPerformanceGoal ? `
    ════════════════════════════════════════════
    O'SHEA PERFORMANCE-ATHLETIK MODUS
    (Scientific Principles and Methods of Strength Fitness)
    ════════════════════════════════════════════
    Dieser User ist ${expLvl}/${activityLvl} und will "${goal_description}".
    Wende die Trainingsphilosophie von John Patrick O'Shea an.

    ── O'SHEA KERNPRINZIPIEN ──────────────────
    1. CORNERSTONE EXERCISES ZUERST: Priorisiere immer die Grundübungen (Squat, Deadlift,
       Press, Pull-Up, Row). Isolationsübungen sind ergänzend, nie Hauptreiz.
    2. PROZENTUALE LASTSTEUERUNG: Schreibe Lasten als % des 1RM in sets_reps_tempo.
       Beispiel: "5x5 @ 80% 1RM" oder "3x10 @ 65% 1RM – Active Rest: 90s Jumping Jacks"
       Nutzer kennen ihr 1RM oder schätzen es. Das ist die Verantwortung des Users.
    3. INTERVAL WEIGHT TRAINING (IWT): Kombiniere Kraft und Ausdauer innerhalb derselben
       Session. Format im notes-Feld: "KRAFTSATZ → ACTIVE REST (30-60s Ausdauer) → ERHOLUNG
       bis Herzfrequenz ≤110 BPM (check auf Smartwatch) → nächster Satz".
       Active Rest Beispiele: Jumping Jacks, Mountain Climbers, Seilspringen, Burpees, Row.
    4. QUANTUM-ZYKLEN (Periodisierung): Strukturiere die 3 Phasen als O'Shea-Zyklen:
       - Phase 1 (Anatomische Adaptation / Volume): 3-4x12-15 @ 60-70% 1RM – Technik, Basis
       - Phase 2 (Hypertrophie/Kraft): 4-5x6-10 @ 70-80% 1RM – Hauptreiz aufbauen
       - Phase 3 (Peak Strength / Intensität): 5-6x3-5 @ 82-92% 1RM – maximale Kraft
    5. ÜBUNGSHIERARCHIE: Immer in dieser Reihenfolge im Performance-Block:
       a) 1-2 Compound Cornerstone Exercises (volle Last, volle Konzentration)
       b) 1-2 unterstützende Verbundübungen (60-75% des Cornerstone-Volumens)
       c) 1 Isolationsübung optional (nur wenn biomechanisch sinnvoll)

    ── NOTES-FELD PFLICHT-FORMAT (IWT) ──────
    Für jede Performance-Block Übung MUSS das notes-Feld enthalten:
    "IWT: Nach jedem Satz → [spezifische Active Rest Übung] für [30-60s] → Pause bis HF ≤110 BPM"
    Beispiel: "IWT: Nach jedem Satz → 45s Jumping Jacks → Pause bis HF ≤110 BPM (Smartwatch prüfen)"

    ── INTENSITÄTSFAKTOREN ──────────────────
    - intensity_factor: Phase 1 = 1.5, Phase 2 = 2.2, Phase 3 = 3.0

    ── NEURO-PRIMER (1 Übung — max. 5 Min.) ─
    ZIEL: Das exakte Bewegungsmuster der ersten Cornerstone-Übung neuronal voraktivieren.
    Regel: Die Übung muss das gleiche Gelenk / gleiche Bewegungsebene ansprechen wie die Hauptübung.
    Beispiele:
    - Vor Squat → Vestibular-Drill: Kopfrotation + Air Squat (Muster + Gleichgewicht)
    - Vor Pull-Up → Sakkadentracking + Scapula Wall Slide (visuell + Schulterblatt-Kontrolle)
    - Vor Deadlift → Hip-Hinge Neuro-Pattern mit Stab (motorisches Einlernen)
    - Vor Press → Thorakale Rotation + Arm-Reach (Schulterachse entriegeln)
    instruction-Feld: Erkläre WARUM dieser Drill direkt die Cornerstone-Übung verbessert.

    ── SLING-ACTIVATION: MFR als "Pre-Load Tissue Prep" (2-3 Übungen) ─
    KEIN generisches Mobility-Programm. Jede Übung hat eine biomechanische Rechtfertigung.
    Struktur pro Übung:
    1. MFR-Node (60-90s): Entsperre das Gewebe, das die Cornerstone-Übung LIMITIERT.
       - Vor Squat: N8 (Hüfte/TFL) oder N11 (Wade/Achillessehne)
       - Vor Pull-Up: N3 (Brustbein/Pec) + N1 (Schädelbasis/Nacken)
       - Vor Deadlift: N9 (Ischiokrurales) oder N10 (Lumbal)
       - Vor Press: N3 (Pec) oder N4 (Schulterblatt)
    2. Mobility-Drill: Aktiviere die neu gewonnene Range sofort in Bewegung.
    notes-Feld PFLICHT: "MFR Pre-Load: [Node X] entsperrt [Gewebe] → direkt mehr Range/Kraft in [Cornerstone-Übung]"

    ── RESILIENCE (1-2 Übungen — Neural Cool-Down nach CNS-Stress) ─
    ZIEL: Nach maximalem IWT-Stress das autonome Nervensystem von Sympathikus → Parasympathikus schalten.
    IMMER: 1 Atemübung (Vagus-Aktivierung) + optional 1 Integration-Bewegung.
    Atemübung: 4-7-8 Atmung ODER Box-Breathing (4s ein, 4s halten, 4s aus, 4s halten).
    Integration: Langsame, kontrollierte Variante einer Übung aus dem Performance-Block (20% Last, 5 Reps).
    notes-Feld: "Neural Cool-Down: Schaltet CNS von Kampfmodus in Regeneration → Adaptation passiert HIER."
    ` : `
    ════════════════════════════════════════════
    O'SHEA BALANCED MODUS
    (Scientific Principles and Methods of Strength Fitness)
    ════════════════════════════════════════════
    Wende O'Sheas Grundprinzipien auch im Balanced-Modus an:

    1. CORNERSTONE EXERCISES: Squat, Hinge, Push, Pull als Basis — immer priorisiert.
    2. PROZENTUALE LAST: sets_reps_tempo immer mit % 1RM angeben (z.B. "3x10 @ 65% 1RM").
    3. IWT LIGHT: Im notes-Feld optional: "Active Rest: 30s leichte Ausdauer zwischen Sätzen,
       Pause bis HF ≤110 BPM (Smartwatch prüfen)".
    4. QUANTUM-ZYKLEN:
       - Phase 1 (Foundation): 3x12-15 @ 60-65% 1RM
       - Phase 2 (Development): 4x8-10 @ 70-75% 1RM
       - Phase 3 (Mastery): 4-5x5-6 @ 78-85% 1RM
    5. intensity_factor: Phase 1 = 1.3, Phase 2 = 1.8, Phase 3 = 2.3

    AXON FLUID LOGIC STRUKTUR — auch im Balanced-Modus biomechanisch begründet:

    1. NEURO-PRIMER (1 Übung): Aktiviert das Muster der ersten Hauptübung.
       Nicht generisch — spezifisch für das Ziel. Gleiche Regeln wie im Performance-Modus.

    2. SLING-ACTIVATION (2 Übungen): MFR als "Pre-Load Tissue Prep":
       - 1 MFR-Node (60s) der das Gewebe für die Hauptübung entsperrt
       - 1 Mobility-Drill der die neue Range sofort nutzt
       notes-Feld PFLICHT: "MFR Pre-Load: [Node] entsperrt [Gewebe] → mehr Range in [Übung]"

    3. PERFORMANCE-BLOCK (3-4 Übungen): Cornerstone First → Supporting.
       % 1RM und O'Shea-Zyklen wie oben beschrieben.

    4. RESILIENCE (1 Übung): Vagus-Aktivierung durch Atemübung.
       notes-Feld: "Neural Cool-Down → Adaptation passiert HIER."
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