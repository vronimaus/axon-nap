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

    // Define 3 phases with detailed exercises
    const phases = [
      {
        phase_number: 1,
        title: 'Fundament & Bewegungskontrolle',
        description: 'In dieser Phase bauen wir die Grundlagen auf: Griffkraft, Schulterstabilität und korrekte Bewegungsmuster. Der Fokus liegt auf Qualität über Quantität.',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'foundation_1',
            name: 'Negativ-Wiederholungen (Eccentric Pull-ups)',
            sets_reps_tempo: '3 Sets × 5 Reps @ 4-5 Sekunden exzentrisch',
            instruction: 'Startposition: Kinn über der Stange (hochspringen oder Hilfsmittel nutzen)\nBewegung: Langsam und kontrolliert über 4-5 Sekunden absenken\nEndposition: Vollständig gestreckte Arme\nPause: 90-120 Sekunden zwischen Sets\nWiederhole für 5 saubere Wiederholungen',
            notes: 'Die exzentrische Phase ist der Schlüssel zum Aufbau von Kraft. Dein Körper kann mehr Gewicht kontrolliert absenken als hochziehen - nutze das zu deinem Vorteil.',
            cues: [
              'Schultern aktiv halten - nicht in die Schultern hängen',
              'Körper bleibt stabil - kein Schwingen',
              'Langsam und kontrolliert - 4-5 Sekunden zählen',
              'Volle Range of Motion - bis die Arme komplett gestreckt sind',
              'Atmen nicht vergessen - ausatmen beim Absenken'
            ],
            common_mistakes: [
              'Zu schnelles Absenken - die Zeit unter Spannung ist entscheidend',
              'Schultern hängen lassen statt aktiv zu halten',
              'Schwung nutzen statt kontrollierter Bewegung'
            ],
            progression_strategy: 'Steigere zuerst die Dauer der exzentrischen Phase (bis 6-7 Sekunden), dann die Anzahl der Wiederholungen (bis 8), dann füge Gewicht hinzu (Gewichtsweste oder Gürtel).',
            progression_milestones: [
              { level: 'Woche 1-2', description: '3×5 @ 4 Sekunden' },
              { level: 'Woche 3-4', description: '3×6 @ 5 Sekunden' },
              { level: 'Woche 5-6', description: '3×8 @ 5 Sekunden oder mit 2.5kg Zusatzgewicht' }
            ],
            expert_insight: {
              quote: 'Eccentric strength is the foundation of concentric power.',
              source: 'Pavel Tsatsouline - Strength Protocol',
              explanation: 'Die exzentrische Phase (Absenken) trainiert die Muskulatur unter maximaler Spannung und aktiviert mehr Muskelfasern als die konzentrische Phase (Hochziehen). Dadurch baust du schneller Kraft auf und vorbereitest den Körper auf vollständige Pull-ups.'
            },
            scientific_background: 'Exzentrisches Training erzeugt größere Kraftzuwächse als konzentrisches Training, da es zu mehr Mikrotrauma in den Muskelfasern führt und die neuronale Anpassung verstärkt.',
            fms_relevance: 'Trainiert das Pull-Pattern und verbessert die Schulterstabilität, essentiell für FMS Shoulder Mobility Pattern.',
            deload_protocol: 'Bei Übertraining: Reduziere auf 2×3 @ 3 Sekunden für eine Woche'
          },
          {
            exercise_id: 'foundation_2',
            name: 'Dead Hang (Aktives Hängen)',
            sets_reps_tempo: '3 Sets × 30-60 Sekunden',
            instruction: 'Startposition: Griff etwas breiter als schulterbreit, voller Griff (Daumen umschließt die Stange)\nAktivierung: Schulterblätter leicht nach unten und zusammen ziehen - aktive Position\nKörperspannung: Beine gestreckt, Füße zusammen, Rumpf angespannt\nHalten: Atme ruhig und gleichmäßig, halte die Spannung\nZiel: 30-60 Sekunden pro Set',
            notes: 'Dies ist keine passive Übung - du sollst aktiv hängen. Die Schultern sind engagiert, nicht entspannt. Dies baut Griffkraft auf und bereitet die Schultern auf Pull-ups vor.',
            cues: [
              'Schultern weg von den Ohren - aktiv nach unten ziehen',
              'Voller Griff - Daumen umschließt die Stange',
              'Körper wie ein Brett - keine Hohlkreuz-Position',
              'Atme ruhig - halte nicht die Luft an',
              'Blick geradeaus oder leicht nach oben'
            ],
            common_mistakes: [
              'Passives Hängen mit entspannten Schultern',
              'Zu weiter Griff - bleib bei schulterbreit',
              'Schwingen oder Pendeln des Körpers'
            ],
            progression_strategy: 'Verlängere die Haltezeit von 30 auf 60 Sekunden, dann füge Gewicht hinzu (Gewichtsweste), dann wechsle zu einarmigem Hang.',
            progression_milestones: [
              { level: 'Woche 1-2', description: '3×30 Sekunden' },
              { level: 'Woche 3-4', description: '3×45 Sekunden' },
              { level: 'Woche 5-6', description: '3×60 Sekunden' }
            ],
            expert_insight: {
              quote: 'Grip strength is the gateway to upper body power.',
              source: 'Dan John - Foundation Principles',
              explanation: 'Griffkraft ist oft der limitierende Faktor bei Pull-ups. Wenn du nicht halten kannst, kannst du nicht ziehen. Der Dead Hang baut diese fundamentale Kraft auf und lehrt die Schultern, Last zu tragen.'
            },
            scientific_background: 'Isometrisches Training (wie Dead Hang) verbessert die Sehnengesundheit und die neuronale Rekrutierung, besonders im Schulter-Komplex.',
            fms_relevance: 'Verbessert die Schulterstabilität und ist ein Assessment für Overhead Movement Pattern.',
            deload_protocol: 'Reduziere auf 3×20 Sekunden bei Ermüdung der Unterarme'
          },
          {
            exercise_id: 'foundation_3',
            name: 'Scapula Pull-ups (Schulterblattzieher)',
            sets_reps_tempo: '3 Sets × 8-12 Reps @ 2 Sekunden Hold',
            instruction: 'Startposition: Dead Hang mit gestreckten Armen\nBewegung: Ziehe nur mit den Schulterblättern - Ellbogen bleiben gestreckt\nEndposition: Schulterblätter zusammen und nach unten, kurz halten\nRückkehr: Kontrolliert zurück in die Startposition\nWiederhole für 8-12 saubere Wiederholungen',
            notes: 'Dies ist eine isolierte Schulterblatt-Übung - die Arme bewegen sich NICHT. Du trainierst die Fähigkeit, die Schulterblätter zu kontrollieren, was essentiell für sichere und starke Pull-ups ist.',
            cues: [
              'Arme bleiben gestreckt - keine Ellbogenbeugung',
              'Denke daran, die Schulterblätter in die Gesäßtaschen zu ziehen',
              'Kleine Bewegung - nur 2-3 cm Bewegung des Körpers',
              'Halte die Position kurz oben - 1-2 Sekunden',
              'Kontrolliere die Rückkehr - nicht einfach fallen lassen'
            ],
            common_mistakes: [
              'Ellbogen beugen statt nur Schulterblätter zu bewegen',
              'Zu große Bewegung - halte es klein und kontrolliert',
              'Keine Pause am obersten Punkt'
            ],
            progression_strategy: 'Steigere die Wiederholungen von 8 auf 15, verlängere die Haltezeit auf 3-5 Sekunden, füge dann Gewicht hinzu.',
            progression_milestones: [
              { level: 'Woche 1-2', description: '3×8 Reps @ 2 Sekunden' },
              { level: 'Woche 3-4', description: '3×12 Reps @ 3 Sekunden' },
              { level: 'Woche 5-6', description: '3×15 Reps @ 3 Sekunden' }
            ],
            expert_insight: {
              quote: 'Scapular control is the key to healthy shoulder function.',
              source: 'Gray Cook - FMS Movement Principles',
              explanation: 'Die meisten Schulterprobleme entstehen durch mangelnde Schulterblattkontrolle. Scapula Pull-ups trainieren genau diese Kontrolle und aktivieren die Muskeln, die für stabile und kraftvolle Pull-ups nötig sind.'
            },
            scientific_background: 'Aktiviert primär den unteren Trapezius und Serratus anterior, essentiell für Schulterstabilität und Verletzungsprävention.',
            fms_relevance: 'Direkt relevant für FMS Shoulder Mobility und Rotary Stability Pattern.',
            deload_protocol: 'Bei Schulterermüdung: 2×5 Reps mit längeren Pausen'
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