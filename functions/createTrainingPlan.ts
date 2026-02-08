import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper function to generate intelligent complementary drill suggestions
async function generateComplementaryDrills(user, goal_description, base44) {
    try {
        // Fetch UserNeuroProfile to understand complaints and needs
        const neuroProfiles = await base44.asServiceRole.entities.UserNeuroProfile.filter({
            user_email: user.email
        });
        
        const neuroProfile = neuroProfiles?.[0] || {};
        const complaintHistory = neuroProfile?.complaint_history || [];
        const activityLevel = neuroProfile?.activity_level || 'lightly_active';
        
        // Fetch FascialChains data
        const fascialChains = await base44.asServiceRole.entities.FascialChain.list();
        
        // Analyze goal to determine relevant body regions and chains
        const goalLower = goal_description.toLowerCase();
        
        const drills = [];
        
        // 1. Mobility drill based on goal
        if (goalLower.includes('pull') || goalLower.includes('klimmz')) {
            drills.push({
                exercise_id: 'shoulder_mobility_flow',
                name: 'Schulter-Mobility Flow',
                category: 'mobility',
                rationale: 'Verbessert die Schultermobilität und Rotation der Thoracic Spine - entscheidend für Pull-up Progression und langfristige Schultergesundheit.',
                instruction: 'Arm-Kreise: 2×20 Wiederholungen vorwärts und rückwärts, langsam und kontrolliert\nWand-Slides: 3×10, Arme an der Wand nach oben schieben\nThorax-Rotation: 2×30 Sekunden pro Seite, im Vierfüßlerstand\nSchulter-Ausrollen: Mit Foam Roller oder Ball 2-3 Minuten pro Seite',
                frequency: 'täglich oder vor jeder Trainingseinheit',
                duration: '5-8 Min'
            });
        } else if (goalLower.includes('squat') || goalLower.includes('pistol')) {
            drills.push({
                exercise_id: 'hip_ankle_mobility',
                name: 'Hüft- und Sprunggelenk-Mobilisation',
                category: 'mobility',
                rationale: 'Öffnet die Hüftflexion und verbessert die Sprunggelenk-Dorsalflexion - kritisch für tiefe Squats und Knie-Longevity.',
                instruction: '90/90 Hip Stretch: 2×60 Sekunden pro Seite\nAnkle Rocks: 3×15 pro Seite, Knie über Zehen schieben\nDeep Squat Hold: 2×45 Sekunden, so tief wie möglich\nCossack Squats: 2×8 pro Seite für dynamische Mobilität',
                frequency: 'täglich oder vor jeder Trainingseinheit',
                duration: '5-8 Min'
            });
        } else if (goalLower.includes('handstand') || goalLower.includes('push')) {
            drills.push({
                exercise_id: 'wrist_shoulder_prep',
                name: 'Handgelenk- und Schulter-Preparation',
                category: 'mobility',
                rationale: 'Bereitet Handgelenke und Schultern auf Gewichtsbelastung vor und fördert gesunde Handgelenk-Alignment - essentiell für Handstand und Push-Bewegungen.',
                instruction: 'Handgelenk-Kreise: 2×20 in beide Richtungen\nHandgelenk-Dehnung: 3×30 Sekunden in Extension und Flexion\nFinger-Dehnung: 2×20 Sekunden pro Position\nSchulter-CARs: 2×5 pro Richtung, volle Kontrolle',
                frequency: 'vor jeder Trainingseinheit',
                duration: '5-10 Min'
            });
        } else {
            // Default mobility drill
            drills.push({
                exercise_id: 'general_mobility_flow',
                name: 'Allgemeine Mobilisations-Routine',
                category: 'mobility',
                rationale: 'Verbessert die allgemeine Beweglichkeit und bereitet den Körper optimal auf das Training vor.',
                instruction: 'Gelenk-Kreise: 2×10 für Handgelenke, Ellbogen, Schultern\nWirbelsäulen-Mobilisation: Cat-Cow 2×15\nHüft-Kreise: 2×10 pro Richtung\nSprunggelenk-Prep: 2×15 Ankle Rocks pro Seite',
                frequency: 'täglich oder vor Training',
                duration: '5-8 Min'
            });
        }
        
        // 2. Strength/Corrective drill based on goal
        if (goalLower.includes('pull') || goalLower.includes('klimmz')) {
            drills.push({
                exercise_id: 'core_stability',
                name: 'Anti-Rotations Core Training',
                category: 'corrective',
                rationale: 'Pull-ups erfordern massive Core-Stabilität. Diese Übungen verhindern Schwingen und verbessern deine Körperspannung am Eisen.',
                instruction: 'Pallof Press: 3×12 pro Seite, Widerstandsband auf Brusthöhe\nDead Bug: 3×10 pro Seite, langsame Kontrolle\nHollow Body Hold: 3×20 Sekunden, maximale Spannung\nBird Dog: 3×8 pro Seite, 3 Sekunden halten',
                frequency: '3x pro Woche',
                duration: '8-10 Min'
            });
        } else if (goalLower.includes('squat') || goalLower.includes('pistol')) {
            drills.push({
                exercise_id: 'single_leg_balance',
                name: 'Einbeinige Balance & Stabilität',
                category: 'corrective',
                rationale: 'Pistol Squats erfordern extreme Balance und Stabilität. Diese Drills bauen die neuronale Kontrolle auf.',
                instruction: 'Single-Leg Stand: 3×30 Sekunden pro Bein, Augen offen\nSingle-Leg Reaches: 3×8 pro Richtung\nCossack Squats: 3×10 pro Seite\nSingle-Leg RDL: 3×8 pro Bein, langsame Kontrolle',
                frequency: '3x pro Woche',
                duration: '8-10 Min'
            });
        } else if (goalLower.includes('handstand') || goalLower.includes('push')) {
            drills.push({
                exercise_id: 'shoulder_stability',
                name: 'Schulter-Stabilisations-Drills',
                category: 'corrective',
                rationale: 'Handstands erfordern maximale Schulterstabilität. Diese Übungen bereiten die Schultern auf Gewichtsbelastung vor.',
                instruction: 'Wall Plank Hold: 3×20-30 Sekunden, Nase zur Wand\nYTWL Sequence: 2×10 jede Position, leichte Gewichte\nBanded Face Pulls: 3×15, fokussiere externe Rotation\nScapular Push-ups: 3×12, nur Schulterblatt-Bewegung',
                frequency: '3-4x pro Woche',
                duration: '8-10 Min'
            });
        } else {
            drills.push({
                exercise_id: 'functional_core',
                name: 'Funktionelle Core-Basis',
                category: 'corrective',
                rationale: 'Ein starker Core ist das Fundament für jede Bewegung. Diese Übungen bauen eine solide Basis auf.',
                instruction: 'Plank: 3×30-45 Sekunden\nSide Plank: 3×20 Sekunden pro Seite\nDead Bug: 3×10 pro Seite\nBird Dog: 3×8 pro Seite',
                frequency: '3x pro Woche',
                duration: '6-8 Min'
            });
        }
        
        // 3. Fascial chain drill if complaints present
        if (complaintHistory.length > 0) {
            const recentComplaint = complaintHistory[0];
            const location = recentComplaint.location?.toLowerCase() || '';
            
            if (location.includes('nacken') || location.includes('schulter')) {
                drills.push({
                    exercise_id: 'sbl_release_drill',
                    name: 'Superficial Back Line Release',
                    category: 'fascial_release',
                    rationale: 'Adressiert Spannungen in der hinteren Faszienkette (SBL), die mit deinen Nacken/Schulter-Beschwerden zusammenhängen. Fördert langfristige Bewegungsfreiheit.',
                    instruction: 'Ball-Release Nacken: 2×90 Sekunden pro Seite, tiefer Druck\nOberer Trapezius: 2×60 Sekunden pro Seite\nLat-Release: Mit Ball oder Roller 2×90 Sekunden\nWaden-Release: 2×60 Sekunden pro Seite, langsame Bewegungen',
                    frequency: '2-3x pro Woche',
                    duration: '8-10 Min'
                });
            } else if (location.includes('rücken') || location.includes('hüfte')) {
                drills.push({
                    exercise_id: 'dfl_activation',
                    name: 'Deep Front Line Activation',
                    category: 'corrective',
                    rationale: 'Stärkt die tiefen anterioren Stabilisatoren, die bei Rücken/Hüft-Problemen oft geschwächt sind. Präventiv für Longevity.',
                    instruction: 'Dead Bug: 3×10 pro Seite, langsame Kontrolle\nBird Dog: 3×8 pro Seite, 3 Sekunden Hold\nPallof Press: 3×12 pro Seite gegen Widerstand\nHollow Body Hold: 3×20 Sekunden',
                    frequency: '3x pro Woche',
                    duration: '6-8 Min'
                });
            }
        }
        
        // 4. Neuro drill for athletic performance
        if (activityLevel === 'very_active' || activityLevel === 'athlete') {
            drills.push({
                exercise_id: 'vestibular_drill',
                name: 'Vestibulärer Balance-Drill',
                category: 'neuro_drill',
                rationale: 'Verbessert das Gleichgewichtssystem und die neuromuskuläre Kontrolle - fundamental für athletische Performance und Sturzprävention (Longevity).',
                instruction: 'Single-Leg Balance: 3×30 Sekunden pro Bein, Augen offen\nSingle-Leg Balance Eyes Closed: 3×20 Sekunden pro Bein\nBalance Reaches: 2×8 pro Richtung, einbeinig stehend\nBalance + Head Turns: 2×10 Kopfdrehungen pro Bein',
                frequency: '2-3x pro Woche',
                duration: '5 Min'
            });
        } else {
            drills.push({
                exercise_id: 'breathing_reset',
                name: 'Diaphragmatischer Atem-Reset',
                category: 'neuro_drill',
                rationale: 'Aktiviert das parasympathische Nervensystem und verbessert Core-Stabilität durch optimale Atemfunktion - essentiell für Erholung und Longevity.',
                instruction: 'Rückenlage mit angewinkelten Knien\nEine Hand auf Brust, eine auf Bauch\nTief durch die Nase einatmen - nur der Bauch hebt sich\nLangsam durch den Mund ausatmen - Bauch sinkt\n5-10 Atemzüge pro Runde, 3 Runden\nZwischen den Runden 30 Sekunden Pause',
                frequency: 'täglich',
                duration: '3-5 Min'
            });
        }
        
        // Return top 3-4 drills (mobility + strength + optional fascial/neuro)
        return drills.slice(0, 4);
        
    } catch (error) {
        console.error('Error generating complementary drills:', error);
        // Return empty array on error - complementary drills are optional
        return [];
    }
}

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
        title: 'Kraftaufbau & Volumen',
        description: 'Jetzt wird es ernst: Wir steigern das Trainingsvolumen und die Intensität. Du wirst erste vollständige Pull-ups schaffen und die Kraft konsolidieren.',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'progression_1',
            name: 'Assisted Pull-ups (Band oder Maschine)',
            sets_reps_tempo: '4 Sets × 4-6 Reps @ kontrolliertes Tempo',
            instruction: 'Setup: Widerstandsband um die Stange und unter die Füße, oder Assisted Pull-up Maschine\nGriff: Schulterbreit, Handflächen nach vorne\nBewegung: Ziehe dich hoch bis das Kinn über der Stange ist\nKontrolle: 2 Sekunden hoch, 1 Sekunde halten, 2 Sekunden runter\nPause: 2 Minuten zwischen Sets',
            notes: 'Wähle ein Band/Gewicht, das dir 4-6 saubere Wiederholungen ermöglicht. Sobald du 6 Reps schaffst, wechsle zu einem leichteren Band oder weniger Unterstützung.',
            cues: [
              'Starte mit aktivierten Schulterblättern - wie bei Scapula Pull-ups',
              'Ellbogen ziehen nach unten und hinten - nicht zur Seite',
              'Brust zur Stange - denke daran, die Brust hochzuziehen',
              'Kontrolliertes Tempo - keine ruckartigen Bewegungen',
              'Volle Range of Motion - komplett hoch und komplett runter'
            ],
            common_mistakes: [
              'Zu viel Unterstützung - fordere dich heraus',
              'Schwung nutzen statt Muskelkraft',
              'Nicht vollständig hochziehen (Kinn muss über Stange)',
              'Zu schnelle Bewegung - Tempo ist wichtig'
            ],
            progression_strategy: 'Reduziere die Unterstützung schrittweise. Beginne mit schwerem Band, wechsle zu mittlerem Band, dann zu leichtem Band, dann zu keiner Unterstützung.',
            progression_milestones: [
              { level: 'Woche 7-8', description: '4×4 mit starkem Band' },
              { level: 'Woche 9-10', description: '4×5 mit mittlerem Band' },
              { level: 'Woche 11-12', description: '4×6 mit leichtem Band' }
            ],
            expert_insight: {
              quote: 'Volume before intensity - earn the right to progress.',
              source: 'Dan John - 40-30-30 Strength Protocol',
              explanation: 'In dieser Phase geht es um Volumen-Akkumulation. Du baust eine solide Basis mit höherem Volumen auf, bevor du zu schwereren Varianten wechselst. Das reduziert Verletzungsrisiko und maximiert langfristige Kraft.'
            },
            scientific_background: 'Assisted Pull-ups erlauben dir, in der vollen Range of Motion zu trainieren, während du deine Kraft aufbaust - besser als partielle Bewegungen.',
            fms_relevance: 'Verbessert Pull Pattern und Shoulder Mobility gleichzeitig.',
            deload_protocol: 'Reduziere auf 3×3 mit mehr Unterstützung für eine Woche'
          },
          {
            exercise_id: 'progression_2',
            name: 'Weighted Negatives (Belastete Exzentriks)',
            sets_reps_tempo: '3 Sets × 3-5 Reps @ 5-6 Sekunden',
            instruction: 'Setup: Gewichtsweste (2.5-5kg) oder Gewichtsgürtel anlegen\nStartposition: Hochspringen oder Hilfsmittel nutzen, Kinn über Stange\nBewegung: Extrem langsam und kontrolliert absenken (5-6 Sekunden)\nEndposition: Arme vollständig gestreckt\nPause: 2-3 Minuten zwischen Sets',
            notes: 'Dies ist eine fortgeschrittene Version der Negativ-Wiederholungen. Das zusätzliche Gewicht intensiviert den Trainingsreiz massiv. Beginne konservativ mit wenig Gewicht.',
            cues: [
              'Noch langsamer als in Phase 1 - 5-6 Sekunden',
              'Totale Körperkontrolle - kein Schwingen',
              'Schultern bleiben aktiv während der gesamten Bewegung',
              'Mentaler Fokus auf jeden Zentimeter der Bewegung',
              'Atme gleichmäßig - nicht die Luft anhalten'
            ],
            common_mistakes: [
              'Zu viel Gewicht zu früh - starte leicht',
              'Zu schnelles Absenken - Zeit unter Spannung ist der Schlüssel',
              'Schultern fallen nach oben (zu den Ohren)'
            ],
            progression_strategy: 'Steigere zuerst die Wiederholungen (bis 5), dann verlängere die Zeit (bis 7 Sekunden), dann erhöhe das Gewicht (in 2.5kg Schritten).',
            progression_milestones: [
              { level: 'Woche 7-8', description: '3×3 @ 5 Sek mit 2.5kg' },
              { level: 'Woche 9-10', description: '3×4 @ 6 Sek mit 2.5kg' },
              { level: 'Woche 11-12', description: '3×5 @ 6 Sek mit 5kg' }
            ],
            expert_insight: {
              quote: 'Add load, not complexity.',
              source: 'Pavel Tsatsouline - Simple & Sinister',
              explanation: 'Statt zu komplexeren Übungen zu wechseln, fügen wir einfach Gewicht zu einer Übung hinzu, die bereits funktioniert. Das ist der direkte Weg zu mehr Kraft.'
            },
            scientific_background: 'Weighted eccentrics erzeugen maximales Muskelwachstum durch erhöhtes mechanisches Trauma bei gleichzeitiger neuronaler Adaptation.',
            fms_relevance: 'Maximiert die exzentrische Kontrolle, essentiell für Injury Prevention.',
            deload_protocol: 'Entferne Gewicht und reduziere auf 2×3 bei Übertraining'
          },
          {
            exercise_id: 'progression_3',
            name: 'Inverted Rows (Australische Klimmzüge)',
            sets_reps_tempo: '3 Sets × 8-12 Reps @ 2 Sekunden hoch, 2 Sekunden runter',
            instruction: 'Setup: Stange auf Hüfthöhe, lege dich darunter\nGriff: Schulterbreit, Handflächen zu dir\nKörper: Gerade wie ein Brett, Fersen am Boden\nBewegung: Ziehe die Brust zur Stange, Ellbogen nah am Körper\nRückkehr: Kontrolliert zurück, Arme gestreckt\nWiederhole für 8-12 Reps',
            notes: 'Dies ist eine horizontale Zugübung und perfektes Ergänzungstraining zu vertikalen Zügen (Pull-ups). Trainiert die gleichen Muskeln aus einem anderen Winkel.',
            cues: [
              'Körper bleibt gerade - keine Hüfte durchhängen lassen',
              'Ziehe mit den Ellbogen, nicht mit den Händen',
              'Brust zur Stange - berühre sie wenn möglich',
              'Schulterblätter zusammen am höchsten Punkt',
              'Kontrolliertes Tempo - 2 Sekunden hoch, 2 Sekunden runter'
            ],
            common_mistakes: [
              'Hüfte sackt durch - halte Körperspannung',
              'Ellbogen gehen zu weit nach außen',
              'Nicht volle Range of Motion - Brust muss zur Stange'
            ],
            progression_strategy: 'Senke die Stange schrittweise ab für einen steileren Winkel, steigere dann Wiederholungen, dann füge Gewicht hinzu (Gewichtsweste).',
            progression_milestones: [
              { level: 'Woche 7-8', description: '3×8 Reps @ Hüfthöhe' },
              { level: 'Woche 9-10', description: '3×10 Reps @ Hüfthöhe' },
              { level: 'Woche 11-12', description: '3×12 Reps @ Hüfthöhe oder 3×8 @ niedriger' }
            ],
            expert_insight: {
              quote: 'Horizontal pulling creates balanced strength and prevents injury.',
              source: 'Vern Gambetta - Movement Pattern Training',
              explanation: 'Viele fokussieren sich nur auf vertikale Züge (Pull-ups) und vernachlässigen horizontale Züge. Das führt zu muskulären Dysbalancen. Rows balancieren das System aus und stärken die Schultergesundheit.'
            },
            scientific_background: 'Horizontale Zugübungen aktivieren verstärkt die Rhomboiden und mittleren Trapezius-Fasern, essentiell für Schultergesundheit.',
            fms_relevance: 'Trainiert Trunk Stability und verbessert das Pull Pattern aus verschiedenen Winkeln.',
            deload_protocol: 'Erhöhe die Stangenhöhe und reduziere auf 2×6 Reps'
          }
        ]
      },
      {
        phase_number: 3,
        title: 'Mastery & Konsolidierung',
        description: 'Du hast das Fundament gelegt und Kraft aufgebaut - jetzt meisterst du das Ziel. Vollständige Pull-ups werden zur Routine, und wir erkunden fortgeschrittene Varianten.',
        duration_weeks: Math.ceil(estimated_duration_weeks / 3),
        exercises: [
          {
            exercise_id: 'mastery_1',
            name: 'Full Pull-ups (Komplette Klimmzüge)',
            sets_reps_tempo: '5 Sets × 1-5 Reps @ kontrolliertes Tempo',
            instruction: 'Startposition: Dead Hang, Arme komplett gestreckt\nAktivierung: Beginne mit Schulterblatt-Aktivierung\nZugphase: Ziehe dich hoch bis Kinn über der Stange\nHold: Kurz halten am höchsten Punkt (1 Sekunde)\nAbsenkphase: Kontrolliert zurück in Dead Hang\nPause: 2-3 Minuten zwischen Sets',
            notes: 'DU HAST ES GESCHAFFT! Dies ist das Ziel. Fokussiere dich auf perfekte Form bei jeder Wiederholung. Qualität über Quantität - jede Rep sollte identisch aussehen.',
            cues: [
              'Starte jeden Rep wie der erste - keine Ermüdung zeigen',
              'Schulterblätter zuerst aktivieren, dann ziehen',
              'Denke daran, die Ellbogen nach unten zu ziehen',
              'Brust hoch - nicht nur das Kinn',
              'Vollständiger Dead Hang zwischen Reps - keine halben Bewegungen'
            ],
            common_mistakes: [
              'Kipping (Schwung mit den Beinen) - halte es strict',
              'Nicht vollständig runtergehen zwischen Reps',
              'Form verschlechtert sich im letzten Rep - stoppe bevor das passiert',
              'Zu lange Pausen zwischen Reps im selben Set'
            ],
            progression_strategy: 'Steigere die Wiederholungen schrittweise von 5×1 auf 5×5. Dann wechsle zu 3×8 für Volumen. Dann beginne mit Weighted Pull-ups.',
            progression_milestones: [
              { level: 'Woche 13-14', description: '5×2 Reps strict' },
              { level: 'Woche 15-16', description: '5×3-4 Reps strict' },
              { level: 'Woche 17-18', description: '5×5 Reps oder 3×8 Reps' }
            ],
            expert_insight: {
              quote: 'Mastery is not about doing more - it is about doing it better.',
              source: 'Pavel Tsatsouline - Grease the Groove Method',
              explanation: 'Jetzt wo du Pull-ups kannst, ist die Versuchung groß, so viele wie möglich zu machen. Aber Mastery kommt von perfekter Ausführung bei jedem Rep. Trainiere mehrmals pro Woche mit niedrigem Volumen aber perfekter Form - Grease the Groove.'
            },
            scientific_background: 'Neuronale Anpassung erreicht ihr Maximum bei niedrigem Volumen aber hoher Frequenz - perfekt für Pull-up Mastery.',
            fms_relevance: 'Vollständige Integration des Pull Pattern mit optimaler Shoulder Mobility.',
            deload_protocol: 'Reduziere auf 3×1 mit 3-4 Minuten Pause zwischen Sets'
          },
          {
            exercise_id: 'mastery_2',
            name: 'Weighted Pull-ups (Belastete Klimmzüge)',
            sets_reps_tempo: '4 Sets × 3-5 Reps @ 2.5-10kg Zusatzgewicht',
            instruction: 'Setup: Gewichtsweste oder Dip-Gürtel mit Gewicht (beginne mit 2.5kg)\nGriff: Standard Overhand Grip, schulterbreit\nBewegung: Identisch zu normalen Pull-ups - perfekte Form\nTempo: Kontrolliert, 2 Sekunden hoch, 1 Sekunde halten, 2 Sekunden runter\nPause: 3 Minuten zwischen Sets',
            notes: 'Weighted Pull-ups sind der nächste Level. Sie bauen maximale Kraft auf und bereiten dich auf fortgeschrittene Varianten vor. Beginne leicht - 2.5kg ist perfekt für den Start.',
            cues: [
              'Form bleibt identisch - Gewicht ändert nichts an der Technik',
              'Kein Kompensieren - wenn Form leidet, ist es zu schwer',
              'Noch kontrollierter als ohne Gewicht',
              'Volle Range of Motion beibehalten',
              'Mentale Fokus auf jeden Zentimeter'
            ],
            common_mistakes: [
              'Zu viel Gewicht zu früh - starte mit 2.5kg',
              'Form verschlechtert sich - reduziere Gewicht',
              'Reps erzwingen - stoppe bei technischem Failure'
            ],
            progression_strategy: 'Steigere die Wiederholungen bei einem Gewicht, bevor du das Gewicht erhöhst. 4×5 @ 2.5kg → 4×3 @ 5kg → 4×5 @ 5kg, usw.',
            progression_milestones: [
              { level: 'Woche 13-15', description: '4×3 @ 2.5kg' },
              { level: 'Woche 16-17', description: '4×5 @ 2.5kg oder 4×3 @ 5kg' },
              { level: 'Woche 18+', description: '4×5 @ 5kg' }
            ],
            expert_insight: {
              quote: 'Strength is a skill. Practice it often with perfect form.',
              source: 'Pavel Tsatsouline - Power to the People',
              explanation: 'Weighted Pull-ups sind eine der besten Übungen für Oberkörper-Kraft. Sie transferieren zu allen anderen Zugbewegungen und bauen funktionelle, dichte Muskulatur auf.'
            },
            scientific_background: 'Progressives Overload durch Gewicht ist effektiver für Kraft als durch Wiederholungen - wenn Form perfekt bleibt.',
            fms_relevance: 'Maximiert die Kraft im Pull Pattern bei gleichzeitiger Beibehaltung optimaler Bewegungsqualität.',
            deload_protocol: 'Entferne Gewicht komplett und mache 3×3 normale Pull-ups'
          },
          {
            exercise_id: 'mastery_3',
            name: 'Volume Training (Volumen-Akkumulation)',
            sets_reps_tempo: 'Ziel: 30-50 Gesamtwiederholungen über mehrere Sets',
            instruction: 'Methode: Ladder Training oder EMOM (Every Minute on the Minute)\nBeispiel Ladder: 1-2-3-4-5 Reps, pause, repeat\nBeispiel EMOM: 5 Reps jeden Minute für 8 Minuten\nFokus: Jeder Rep ist perfekt - keine Ermüdung zeigen\nZiel: Erreiche 30 saubere Reps, dann 40, dann 50\nFrequenz: 2x pro Woche',
            notes: 'Volume Training baut Work Capacity auf - die Fähigkeit, viele Reps über Zeit zu machen. Dies konsolidiert deine Kraft und macht Pull-ups zur zweiten Natur.',
            cues: [
              'Halte Reserve - stoppe 1-2 Reps vor dem Failure',
              'Jeder Rep identisch - keine Ermüdung zeigen',
              'Atme zwischen Sets - volle Erholung',
              'Mentale Frische ist wichtig - keine gegrindeten Reps',
              'Tracke Gesamt-Volume - das ist deine Metrik'
            ],
            common_mistakes: [
              'Zu viele Reps pro Set - halte Reserve',
              'Form verschlechtert sich - stoppe früher',
              'Zu wenig Pause zwischen Sets'
            ],
            progression_strategy: 'Erhöhe das Gesamt-Volume schrittweise. 30 Reps → 35 Reps → 40 Reps → 50 Reps über mehrere Wochen.',
            progression_milestones: [
              { level: 'Woche 13-14', description: '30 Reps total' },
              { level: 'Woche 15-16', description: '40 Reps total' },
              { level: 'Woche 17-18', description: '50 Reps total' }
            ],
            expert_insight: {
              quote: 'Volume creates the foundation for long-term strength.',
              source: 'Dan John - Easy Strength Protocol',
              explanation: 'Volume Training an einem Tag pro Woche baut Work Capacity auf und sorgt dafür, dass Pull-ups nie wieder schwer werden. Dies ist die langfristige Strategie für bulletproof Kraft.'
            },
            scientific_background: 'Hohe Frequenz mit moderatem Volumen verbessert neuronale Effizienz und macht Bewegungen automatisch.',
            fms_relevance: 'Konsolidiert Movement Pattern und macht es zum Standard-Bewegungsmuster.',
            deload_protocol: 'Reduziere auf 20 Reps total mit längeren Pausen'
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

    // Generate intelligent complementary drill suggestions
    const complementaryDrills = await generateComplementaryDrills(user, goal_description, base44);

    const plan = await base44.entities.TrainingPlan.create({
      user_email: user.email,
      goal_description: goal_description,
      estimated_duration_weeks: estimated_duration_weeks,
      status: 'active',
      plan_generated_date: new Date().toISOString().split('T')[0],
      current_phase: 1,
      phase_start_date: new Date().toISOString().split('T')[0],
      phases: phases,
      suggested_complementary_drills: complementaryDrills,
      complementary_drills_accepted: false
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