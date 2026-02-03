import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_description, training_frequency } = await req.json();

    // Calculate estimated duration based on frequency
    const frequencyMap = {
      '2_3_times_week': 8,
      '4_5_times_week': 6,
      'daily': 4
    };

    const estimated_duration_weeks = frequencyMap[training_frequency] || 8;

    // Define 3 phases with exercises
    const phases = [
      {
        phase_number: 1,
        title: 'Fundament legen',
        description: 'Basis-Techniken, Griffkraft und Bewegungskontrolle aufbauen',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'foundation_1',
            name: 'Negativ-Wiederholungen',
            sets_reps_tempo: '3x5',
            instruction: 'Von oben springen, langsam (3-4 Sekunden) herunterlassen',
            notes: 'Fokus auf kontrollierte Bewegung'
          },
          {
            exercise_id: 'foundation_2',
            name: 'Dead Hang',
            sets_reps_tempo: '3x30-60s',
            instruction: 'An der Stange hängen, Schultern aktiv',
            notes: 'Griffkraft-Fundament'
          },
          {
            exercise_id: 'foundation_3',
            name: 'Scapula Pull-ups',
            sets_reps_tempo: '3x8',
            instruction: 'Schulterblattzieher ohne Ellbogenbeugung',
            notes: 'Aktivierungsdrills'
          }
        ]
      },
      {
        phase_number: 2,
        title: 'Progression',
        description: 'Kraft progressiv aufbauen mit gezielten Varianten',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'progression_1',
            name: 'Assisted Pull-ups',
            sets_reps_tempo: '4x4-6',
            instruction: 'Mit Widerstandsband oder Maschine unterstützen',
            notes: 'Gewicht reduzieren wenn möglich'
          },
          {
            exercise_id: 'progression_2',
            name: 'Negativ-Wiederholungen (schwerer)',
            sets_reps_tempo: '3x3',
            instruction: 'Mit Gewicht um die Hüfte hochspringen, langsam runterlassen',
            notes: 'Intensivere Negatives'
          },
          {
            exercise_id: 'progression_3',
            name: 'Reihen-Varianten',
            sets_reps_tempo: '3x6',
            instruction: 'Zur Stange hochziehen, Rückenmuskulatur trainieren',
            notes: 'Antagonist-Training'
          }
        ]
      },
      {
        phase_number: 3,
        title: 'Meistern',
        description: 'Ziel stabilisieren und neue Varianten erkunden',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'mastery_1',
            name: 'Volle Pull-ups',
            sets_reps_tempo: '5x1-3',
            instruction: 'Vollständige Wiederholungen vom Dead Hang bis Kinn über Stange',
            notes: 'Stabil durchziehen, kein Schwung'
          },
          {
            exercise_id: 'mastery_2',
            name: 'Rückenschlag-Varianten',
            sets_reps_tempo: '3x5',
            instruction: 'Rückenschläge oder L-Sit Pull-ups',
            notes: 'Neue Herausforderung'
          },
          {
            exercise_id: 'mastery_3',
            name: 'Volumen-Session',
            sets_reps_tempo: '3x3-5',
            instruction: 'Mehrere Wiederholungen für Volumen',
            notes: 'Kraft stabilisieren'
          }
        ]
      }
    ];

    // Create the training plan
    console.log('Creating training plan with data:', {
      user_email: user.email,
      goal_description,
      estimated_duration_weeks,
      phases_count: phases.length
    });

    const plan = await base44.entities.TrainingPlan.create({
      user_email: user.email,
      goal_description: goal_description,
      estimated_duration_weeks: estimated_duration_weeks,
      status: 'active',
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      phase_start_date: new Date().toISOString().split('T')[0],
      phases: phases
    });

    console.log('Training plan created successfully:', plan?.id);

    return Response.json({ 
      success: true,
      plan: plan,
      message: `${estimated_duration_weeks}-Wochen-Plan erstellt`
    });

  } catch (error) {
    console.error('Error creating training plan - full error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message, errorType: error.constructor.name }, { status: 500 });
  }
});