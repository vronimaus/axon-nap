import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal } = await req.json();

    if (!goal) {
      return Response.json({ error: 'Goal is required' }, { status: 400 });
    }

    // Definiere ziel-spezifische Baselines basierend auf dem Trainings-Ziel
    const baselineMap = {
      'pull_up': {
        goal_type: 'pull',
        tests: [
          {
            name: 'Max Pull-ups',
            unit: 'reps',
            question: 'Wie viele vollständige Pull-ups kannst du momentan machen?',
            hint: 'Dead hang bis vollständige Extension, Kinn über die Stange'
          },
          {
            name: 'Hang Zeit',
            unit: 'seconds',
            question: 'Wie lange kannst du im Dead Hang hängen?',
            hint: 'Arme gestreckt, aktive Schultern'
          },
          {
            name: 'Scapula Pull-up Reps',
            unit: 'reps',
            question: 'Wie viele Scapula Pull-ups (nur Schulterzucken) kannst du machen?',
            hint: 'Nur Schulter-Elevation, keine Arm-Flexion'
          }
        ]
      },
      'pistol_squat': {
        goal_type: 'squat',
        tests: [
          {
            name: 'Pistol Squat Reps (eine Seite)',
            unit: 'reps',
            question: 'Wie viele Pistol Squats auf einer Seite schaffst du?',
            hint: 'Volle Tiefe, Gegenseite gestreckt'
          },
          {
            name: 'Deep Squat Hold',
            unit: 'seconds',
            question: 'Wie lange kannst du in der unteren Position einer tiefen Kniebeuge halten?',
            hint: 'Beide Füße flach'
          },
          {
            name: 'Goblet Squat Max',
            unit: 'kg',
            question: 'Was ist dein maximales Gewicht für Goblet Squats (gute Form)?',
            hint: 'Mit Kettlebell oder Dumbbell vor der Brust'
          }
        ]
      },
      'bent_bridge': {
        goal_type: 'mobility',
        tests: [
          {
            name: 'Backbend Tiefe',
            unit: 'cm',
            question: 'Wie weit kannst du nach hinten gehen? (Gemessen von Kopf zu Fersen)',
            hint: 'Mit Händen auf dem Boden, Brust nach oben'
          },
          {
            name: 'Thoracic Extension Bewegungsradius',
            unit: 'points',
            question: 'Wie viel Wirbelsäulen-Extension hast du? (1=minimal, 10=sehr viel)',
            hint: 'Brustwirbelsäule-Mobilität'
          },
          {
            name: 'Hip Flexor Dehnung Empfindung',
            unit: 'points',
            question: 'Wie stramm sind deine Hüftbeuger? (1=sehr eng, 10=sehr locker)',
            hint: 'Vordere Hüfte, insbesondere Iliopsoas'
          }
        ]
      },
      'handstand': {
        goal_type: 'balance',
        tests: [
          {
            name: 'Handstand Hold Zeit',
            unit: 'seconds',
            question: 'Wie lange kannst du einen Handstand gegen die Wand halten?',
            hint: 'Mit Support an der Wand'
          },
          {
            name: 'Shoulder Mobility (overhead reach)',
            unit: 'points',
            question: 'Wie ist deine Schulterüberkopf-Mobilität? (1=eingeschränkt, 10=sehr frei)',
            hint: 'Arms fully overhead'
          },
          {
            name: 'Wrist Strength Empfindung',
            unit: 'points',
            question: 'Wie stark/stabil sind deine Handgelenke? (1=schwach, 10=sehr stark)',
            hint: 'Wrist stability in inversion'
          }
        ]
      },
      'generic': {
        goal_type: 'generic',
        tests: [
          {
            name: 'Aktuelles Fitness-Level',
            unit: 'points',
            question: 'Wie würdest du dein aktuelles Fitness-Level selbst einschätzen? (1=Anfänger, 10=Fortgeschritten)',
            hint: 'Generelle selbsteinschätzung'
          },
          {
            name: 'Training Experience',
            unit: 'points',
            question: 'Wie lange trainierst du bereits strukturiert? (1=neu, 10=viele Jahre)',
            hint: 'Gesamt-Trainingserfahrung'
          },
          {
            name: 'Aktuelle Limitationen',
            unit: 'text',
            question: 'Gibt es aktuelle körperliche Limitationen oder Verletzungen?',
            hint: 'z.B. alte Verletzungen, chronische Schmerzen'
          }
        ]
      }
    };

    // Wähle die passenden Tests basierend auf dem Ziel
    const goalLower = goal.toLowerCase();
    let selectedTests = baselineMap['generic'].tests; // Fallback

    // Versuche exakte Übereinstimmung zu finden
    for (const [key, config] of Object.entries(baselineMap)) {
      if (goalLower.includes(key) || key === goalLower) {
        selectedTests = config.tests;
        break;
      }
    }

    return Response.json({
      goal,
      tests: selectedTests,
      instructions: 'Beantworte folgende Fragen ehrlich. Dies hilft uns, dein optimales Trainingsplan zu erstellen.'
    });
  } catch (error) {
    console.error('Error in generateGoalSpecificBaselines:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});