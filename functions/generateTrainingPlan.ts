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

    // Fetch exercises, routines, FAQs
    const [allExercises, allRoutines, allFaqs] = await Promise.all([
      base44.asServiceRole.entities.Exercise.list('-updated_date', 200),
      base44.asServiceRole.entities.Routine.list('-updated_date', 100),
      base44.asServiceRole.entities.FAQ.list('-updated_date', 100)
    ]);

    const availableExerciseIds = allExercises.map(e => e.exercise_id).filter(Boolean);
    const availableRoutineIds = allRoutines.slice(0, 10).map(r => r.id).filter(Boolean);
    const availableFaqIds = allFaqs.slice(0, 10).map(f => f.faq_id).filter(Boolean);

    console.log(`[generateTrainingPlan] Goal: ${goal_description}, Exercises: ${availableExerciseIds.length}`);

    const planData = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle einen detaillierten 3-Phasen Trainingsplan auf Deutsch für folgendes Ziel:

Ziel: ${goal_description}
Baseline: ${baseline || 'Nicht angegeben'}
Activity Level: ${activityLvl}
Erfahrung: ${expLvl}
Sport: ${sport}
Fitness Goals: ${fitnessGoals}

Jede Phase MUSS mindestens 4 Übungen enthalten mit konkreten deutschen Anweisungen.

Phase 1 (Foundation, 2 Wochen): Grundlagen, Mobilisation, neuronale Aktivierung
Phase 2 (Development, 3 Wochen): Kraftaufbau, Progressionen, Bewegungsmuster
Phase 3 (Mastery, 3 Wochen): Performance, Zielübung, funktionelle Integration

Verfügbare Übungs-IDs (verwende NUR diese):
${availableExerciseIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}

Verfügbare Routine-IDs:
${availableRoutineIds.map((id, i) => `${i + 1}. ${id}`).join('\n')}

Verfügbare FAQ-IDs:
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
                      notes: { type: 'string' }
                    },
                    required: ['exercise_id', 'name', 'sets_reps_tempo', 'instruction']
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

    // Enrich exercises with DB data
    const enrichedPhases = await Promise.all(
      planData.phases.map(async (phase) => {
        const enrichedExercises = await Promise.all(
          (phase.exercises || []).map(async (exercise) => {
            try {
              const matches = await base44.asServiceRole.entities.Exercise.filter({ exercise_id: exercise.exercise_id });
              if (matches.length > 0) {
                const ex = matches[0];
                return {
                  ...exercise,
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
            } catch (_e) {
              return exercise;
            }
          })
        );
        return { ...phase, exercises: enrichedExercises };
      })
    );

    const plan = await base44.asServiceRole.entities.TrainingPlan.create({
      user_email: user.email,
      goal_description,
      phases: enrichedPhases,
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