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
                instruction: '1. ARM-KREISE (2×20 vorwärts, 2×20 rückwärts)\nStartposition: Aufrecht stehen, Füße hüftbreit, Arme seitlich gestreckt auf Schulterhöhe\nBewegung: Kleine kontrollierte Kreise mit gestreckten Armen, nur aus dem Schultergelenk\nFokus: Langsam und bewusst, spüre die volle Rotation der Schulter\n\n2. WAND-SLIDES (3×10 Wiederholungen)\nStartposition: Rücken flach gegen Wand, Füße 10cm von Wand entfernt, Arme gebeugt mit Unterarmen an Wand (wie "Hände hoch"-Position)\nBewegung: Schiebe beide Arme langsam nach oben an der Wand entlang, so weit wie möglich ohne Rücken von Wand zu lösen\nZurück: Kontrolliert zurück zur Startposition, Unterarme bleiben an Wand\nAchtung: Unterer Rücken bleibt flach an Wand - kein Hohlkreuz!\n\n3. THORAX-ROTATION (2×30 Sekunden pro Seite)\nStartposition: Vierfüßlerstand, Hände unter Schultern, Knie unter Hüften\nRechte Hand: Lege rechte Hand hinter Kopf, Ellbogen zeigt zur Seite\nBewegung: Drehe Oberkörper nach rechts auf, führe rechten Ellbogen zur Decke\nHalten: 30 Sekunden in maximaler Rotation, atme ruhig\nSeite wechseln und wiederholen\n\n4. SCHULTER-AUSROLLEN mit Ball (2-3 Minuten pro Seite)\nPosition: Seitlich an Wand oder auf Boden liegend\nBall-Platzierung: Lacrosse-Ball oder Tennisball auf hinteren Schultermuskel (zwischen Schulterblatt und Wirbelsäule)\nTechnik: Langsam in kleinen Kreisen rollen, bei schmerzhaften Punkten 20 Sekunden verweilen\nAtmung: Tief ein- und ausatmen, entspanne in den Schmerz hinein',
                frequency: 'täglich oder vor jeder Trainingseinheit',
                duration: '5-8 Min'
            });
        } else if (goalLower.includes('squat') || goalLower.includes('pistol')) {
            drills.push({
                exercise_id: 'hip_ankle_mobility',
                name: 'Hüft- und Sprunggelenk-Mobilisation',
                category: 'mobility',
                rationale: 'Öffnet die Hüftflexion und verbessert die Sprunggelenk-Dorsalflexion - kritisch für tiefe Squats und Knie-Longevity.',
                instruction: '1. 90/90 HIP STRETCH (2×60 Sekunden pro Seite)\nStartposition: Sitze am Boden, rechtes Bein 90° vor dir gebeugt (Knie zeigt nach vorne), linkes Bein 90° zur Seite gebeugt\nOberkörper: Aufrecht bleiben, leicht nach vorne lehnen zur rechten Seite\nHalten: 60 Sekunden, atme tief, spüre Dehnung in rechter Hüft-Außenseite\nSeite wechseln\n\n2. ANKLE ROCKS (3×15 pro Seite)\nStartposition: Ausfallschritt-Position, rechter Fuß vorne, Hände stützen seitlich\nBewegung: Schiebe rechtes Knie kontrolliert nach vorne über die Zehen, Ferse bleibt am Boden\nZurück: Kehre zur Startposition zurück ohne Ferse zu heben\nFokus: Maximale Dorsalflexion im Sprunggelenk, keine seitliche Ausweichbewegung\n15 Wiederholungen, dann Seite wechseln\n\n3. DEEP SQUAT HOLD (2×45 Sekunden)\nStartposition: Stehe mit Füßen etwas breiter als schulterbreit, Zehen leicht nach außen\nBewegung: Gehe in tiefste Squat-Position, Fersen bleiben am Boden, Knie zeigen über Zehen\nHände: Vor Brust oder zwischen Knien zur Balance\nHalten: 45 Sekunden, atme ruhig, versuche tiefer zu sinken\n\n4. COSSACK SQUATS (2×8 pro Seite)\nStartposition: Sehr breiter Stand, Füße parallel\nBewegung: Verlagere Gewicht nach rechts, beuge rechtes Bein komplett, linkes Bein gestreckt zur Seite, linke Fußspitze zeigt nach oben\nHände: Vor Brust oder als Balance-Hilfe\nWechsel: Dynamisch zur anderen Seite, 8 Wiederholungen pro Seite',
                frequency: 'täglich oder vor jeder Trainingseinheit',
                duration: '5-8 Min'
            });
        } else if (goalLower.includes('handstand') || goalLower.includes('push')) {
            drills.push({
                exercise_id: 'wrist_shoulder_prep',
                name: 'Handgelenk- und Schulter-Preparation',
                category: 'mobility',
                rationale: 'Bereitet Handgelenke und Schultern auf Gewichtsbelastung vor und fördert gesunde Handgelenk-Alignment - essentiell für Handstand und Push-Bewegungen.',
                instruction: '1. HANDGELENK-KREISE (2×20 pro Richtung)\nStartposition: Vierfüßlerstand oder stehend mit ausgestreckten Armen\nBewegung: Langsame, kontrollierte Kreise mit den Händen, erst 20x im Uhrzeigersinn, dann 20x gegen Uhrzeigersinn\nFokus: Volle Range of Motion, spüre die Mobilisation im Handgelenk\n\n2. HANDGELENK-DEHNUNG (3×30 Sekunden pro Position)\nExtension: Vierfüßlerstand, Finger zeigen nach hinten (zu Knien), schiebe Körpergewicht sanft nach hinten\nFlexion: Vierfüßlerstand, Handrücken auf Boden, Finger zeigen nach hinten, sanft belasten\nSeitlich: Hand flach auf Boden, Finger zur Seite, leicht belasten und halten\nJede Position 30 Sekunden halten, tief atmen\n\n3. FINGER-DEHNUNG (2×20 Sekunden pro Position)\nPosition 1: Rechte Hand flach vor dir, linke Hand zieht Finger der rechten Hand sanft nach hinten (Extension)\nPosition 2: Rechte Hand Faust, linke Hand umfasst und zieht sanft in Flexion\nJede Position 20 Sekunden halten, dann Hand wechseln\n\n4. SCHULTER-CARS (2×5 pro Richtung)\nStartposition: Stehend, rechter Arm gestreckt\nBewegung: Führe rechten Arm in größtmöglichem Kreis - erst nach vorne hoch, dann seitlich nach hinten-unten, maximale Kontrolle\nReverse: Gleicher Kreis in umgekehrter Richtung\n5 Runden pro Richtung, dann linker Arm\nFokus: Volle Range of Motion, keine Kompensation mit Körper',
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
                instruction: '1. GELENK-KREISE (2×10 für Handgelenke, Ellbogen, Schultern)\nHandgelenke: 10 Kreise pro Richtung, langsam und kontrolliert\nEllbogen: Arme seitlich, 10 kleine Kreise mit Unterarmen\nSchultern: Große Kreise, 10 vorwärts, 10 rückwärts\n\n2. CAT-COW (2×15 Wiederholungen)\nStartposition: Vierfüßlerstand, Hände unter Schultern, Knie unter Hüften\nCow: Einatmen, Bauch senken, Brust nach vorne, Blick nach oben\nCat: Ausatmen, Rücken runden, Kinn zur Brust\n15 fließende Wiederholungen\n\n3. HÜFT-KREISE (2×10 pro Richtung)\nStartposition: Stehend, Hände in Hüften\nBewegung: Große Kreise mit Hüfte, 10x im Uhrzeigersinn, 10x dagegen\nOberkörper bleibt stabil\n\n4. ANKLE ROCKS (2×15 pro Seite)\nAusfallschritt-Position, vorderes Knie schiebt über Zehen nach vorne\nFerse bleibt am Boden, 15 Wiederholungen pro Seite',
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
                instruction: '1. PALLOF PRESS (3×12 pro Seite)\nSetup: Widerstandsband auf Brusthöhe befestigt, seitlich zum Ankerpunkt stehen (ca. 1m Abstand)\nStartposition: Band mit beiden Händen vor Brust halten, Körper stabil\nBewegung: Arme langsam nach vorne strecken gegen den Widerstand des Bands, Körper bleibt frontal ausgerichtet\nZurück: Kontrolliert zurück zur Brust\nFokus: Keine Rotation - Rumpf bleibt stabil! 12 Wiederholungen, dann Seite wechseln\n\n2. DEAD BUG (3×10 pro Seite)\nStartposition: Rückenlage, Arme senkrecht nach oben gestreckt, Knie 90° gebeugt über Hüften\nBewegung: Strecke rechtes Bein langsam aus (schwebt über Boden), linker Arm geht gestreckt nach hinten über Kopf\nZurück: Kontrolliert zurück zur Startposition, dann Seite wechseln\nAchtung: Unterer Rücken bleibt am Boden gedrückt! Keine Ausweichbewegung\n10 Wiederholungen pro Seite\n\n3. HOLLOW BODY HOLD (3×20 Sekunden)\nStartposition: Rückenlage, Arme gestreckt über Kopf, Beine gestreckt\nPosition: Hebe Schultern und Beine wenige cm vom Boden, unterer Rücken bleibt am Boden\nKörper: Spanne als wäre dein Körper ein Brett - maximale Ganzkörperspannung\nHalten: 20 Sekunden, atme flach und kontrolliert\n\n4. BIRD DOG (3×8 pro Seite, 3 Sekunden Hold)\nStartposition: Vierfüßlerstand, neutraler Rücken\nBewegung: Strecke rechten Arm nach vorne und linkes Bein nach hinten - eine gerade Linie\nHalten: 3 Sekunden in Endposition, spüre die Spannung\nZurück: Kontrolliert zurück, dann andere Seite\n8 Wiederholungen pro Seite',
                frequency: '3x pro Woche',
                duration: '8-10 Min'
            });
        } else if (goalLower.includes('squat') || goalLower.includes('pistol')) {
            drills.push({
                exercise_id: 'single_leg_balance',
                name: 'Einbeinige Balance & Stabilität',
                category: 'corrective',
                rationale: 'Pistol Squats erfordern extreme Balance und Stabilität. Diese Drills bauen die neuronale Kontrolle auf.',
                instruction: '1. SINGLE-LEG STAND (3×30 Sekunden pro Bein)\nStartposition: Stehe auf rechtem Bein, linkes Bein leicht angewinkelt vor dir\nBalance: Finde stabile Position, Arme seitlich oder vor Brust\nFokus: Blick fixiert auf einem Punkt, minimale Bewegung im Standbein\n30 Sekunden halten, dann Bein wechseln\n\n2. SINGLE-LEG REACHES (3×8 pro Richtung)\nStartposition: Stehe auf rechtem Bein\nReach 1: Beuge dich nach vorne, berühre Boden vor dir mit linker Hand (rechtes Bein bleibt stabil)\nReach 2: Beuge zur rechten Seite, berühre rechten Fuß\nReach 3: Drehe Oberkörper, berühre Punkt hinter dir\n8 Reaches in jede Richtung, dann Bein wechseln\n\n3. COSSACK SQUATS (3×10 pro Seite)\nStartposition: Sehr breiter Stand, Füße parallel\nBewegung: Verlagere Gewicht nach rechts, beuge rechtes Bein tief, linkes Bein gestreckt, Fußspitze hoch\nBalance: Arme vor Brust oder als Balance\nDynamisch von Seite zu Seite wechseln, 10 Wiederholungen pro Seite\n\n4. SINGLE-LEG RDL (3×8 pro Bein)\nStartposition: Stehe auf rechtem Bein, linkes Bein leicht hinter dir\nBewegung: Beuge aus Hüfte nach vorne, linkes Bein streckt nach hinten, Körper bildet T-Form\nHände: Vor Brust oder zur Balance seitlich\nKontrolle: Langsam runter und hoch, 8 Wiederholungen, dann Bein wechseln',
                frequency: '3x pro Woche',
                duration: '8-10 Min'
            });
        } else if (goalLower.includes('handstand') || goalLower.includes('push')) {
            drills.push({
                exercise_id: 'shoulder_stability',
                name: 'Schulter-Stabilisations-Drills',
                category: 'corrective',
                rationale: 'Handstands erfordern maximale Schulterstabilität. Diese Übungen bereiten die Schultern auf Gewichtsbelastung vor.',
                instruction: '1. WALL PLANK HOLD (3×20-30 Sekunden)\nSetup: Hände auf Boden, Füße an Wand hochgehen bis Körper fast senkrecht\nPosition: Arme gestreckt, Hände schulterbreit, Nase zeigt zur Wand, Körper gerade wie Brett\nFokus: Aktiv in Schultern drücken, nicht in Schultern "hängen"\n20-30 Sekunden halten\n\n2. YTWL SEQUENCE (2×10 jede Position)\nStartposition: Vorgebeugt (Hüfte 90°) oder auf Bauch liegend, leichte Hanteln (1-2kg) in Händen\nY: Arme schräg über Kopf (wie Y), Daumen zeigen hoch, heben und senken\nT: Arme seitlich (wie T), Handflächen nach unten, heben und senken\nW: Ellbogen 90° gebeugt, ziehe Ellbogen nach hinten (wie W)\nL: Ellbogen 90° seitlich, rotiere Unterarme nach oben\nJede Position 10 Wiederholungen, kontrolliert und langsam\n\n3. BANDED FACE PULLS (3×15)\nSetup: Widerstandsband auf Gesichtshöhe befestigt, Griff mit beiden Händen\nBewegung: Ziehe Band zu Gesicht, Ellbogen gehen nach außen-hinten, Hände enden neben Ohren\nFokus: Externe Rotation der Schultern, Schulterblätter zusammen\n15 Wiederholungen\n\n4. SCAPULAR PUSH-UPS (3×12)\nStartposition: Normale Push-up-Position (oder auf Knien), Arme gestreckt\nBewegung: NUR Schulterblätter bewegen - lasse Körper zwischen Schulterblättern absinken, dann drücke aktiv hoch\nArme: Bleiben die ganze Zeit gestreckt - keine Ellbogenbeugung!\n12 Wiederholungen, spüre die Schulterblatt-Bewegung',
                frequency: '3-4x pro Woche',
                duration: '8-10 Min'
            });
        } else {
            drills.push({
                exercise_id: 'functional_core',
                name: 'Funktionelle Core-Basis',
                category: 'corrective',
                rationale: 'Ein starker Core ist das Fundament für jede Bewegung. Diese Übungen bauen eine solide Basis auf.',
                instruction: '1. PLANK (3×30-45 Sekunden)\nStartposition: Unterarmstütz, Ellbogen unter Schultern, Körper gerade wie Brett\nFokus: Bauch angespannt, Gesäß angespannt, keine Hüfte durchhängen\n30-45 Sekunden halten\n\n2. SIDE PLANK (3×20 Sekunden pro Seite)\nStartposition: Seitlage, Unterarm am Boden, Körper gerade\nPosition: Hüfte hoch, Körper bildet gerade Linie\n20 Sekunden pro Seite\n\n3. DEAD BUG (3×10 pro Seite)\nRückenlage, Arme senkrecht hoch, Knie 90° gebeugt\nGegenläufige Bewegung: Rechtes Bein strecken + linker Arm nach hinten\n10 Wiederholungen pro Seite\n\n4. BIRD DOG (3×8 pro Seite)\nVierfüßlerstand, rechter Arm vor + linkes Bein hinten strecken\nGerade Linie halten, 3 Sekunden\n8 Wiederholungen pro Seite',
                frequency: '3x pro Woche',
                duration: '6-8 Min'
            });
        }
        
        // 2. Fascial chain drill if complaints present
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
        
        // 3. Neuro drill for athletic performance
        if (activityLevel === 'very_active' || activityLevel === 'athlete') {
            drills.push({
                exercise_id: 'vestibular_drill',
                name: 'Vestibulärer Balance-Drill',
                category: 'neuro_drill',
                rationale: 'Verbessert das Gleichgewichtssystem und die neuromuskuläre Kontrolle - fundamental für athletische Performance und Sturzprävention (Longevity).',
                instruction: '1. SINGLE-LEG BALANCE AUGEN OFFEN (3×30 Sekunden pro Bein)\nStartposition: Stehe auf rechtem Bein, linkes Bein leicht angewinkelt\nBlick: Fixiere einen Punkt vor dir auf Augenhöhe\nBalance: Minimiere Bewegung, spüre die Stabilisierung\n30 Sekunden, dann Bein wechseln\n\n2. SINGLE-LEG BALANCE AUGEN GESCHLOSSEN (3×20 Sekunden pro Bein)\nGleiche Position wie oben, aber: Schließe die Augen\nFokus: Verlasse dich nur auf dein Gleichgewichtssystem (Innenohr)\n20 Sekunden pro Bein - deutlich schwieriger!\n\n3. BALANCE REACHES (2×8 pro Richtung)\nAuf einem Bein stehend, reiche mit Hand in verschiedene Richtungen:\n- Nach vorne-unten (Boden berühren)\n- Zur Seite\n- Nach hinten\n8 Reaches pro Richtung, dann Bein wechseln\n\n4. BALANCE + HEAD TURNS (2×10 Kopfdrehungen pro Bein)\nStehe auf einem Bein, stabil balancieren\nKopfbewegung: Drehe Kopf langsam von links nach rechts\n10 Kopfdrehungen während du die Balance hältst\nFortgeschritten: Kombiniere mit Augen schließen',
                frequency: '2-3x pro Woche',
                duration: '5 Min'
            });
        } else {
            drills.push({
                exercise_id: 'breathing_reset',
                name: 'Diaphragmatischer Atem-Reset',
                category: 'neuro_drill',
                rationale: 'Aktiviert das parasympathische Nervensystem und verbessert Core-Stabilität durch optimale Atemfunktion - essentiell für Erholung und Longevity.',
                instruction: 'SETUP:\nLege dich auf den Rücken, Knie angewinkelt, Füße flach am Boden\nEine Hand auf Brust, andere Hand auf Bauch\n\nATMUNG:\n1. EINATMEN durch die Nase (4 Sekunden):\n   - NUR der Bauch hebt sich (Hand auf Bauch steigt)\n   - Hand auf Brust bleibt ruhig liegen\n   - Spüre wie sich dein Zwerchfell nach unten bewegt\n\n2. KURZ HALTEN (1 Sekunde)\n\n3. AUSATMEN durch den Mund (6 Sekunden):\n   - Bauch sinkt langsam\n   - Vollständig ausatmen\n\n4. KURZE PAUSE (2 Sekunden)\n\nWIEDERHOLUNGEN:\n- 5-10 Atemzüge = 1 Runde\n- 30 Sekunden Pause\n- 3 Runden insgesamt\n\nFOKUS: Entspannung, kein Stress - lass den Atem fließen',
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

// Helper function to generate training plan phases via LLM
async function generateTrainingPlanPhases(user, goal_description, training_frequency, base44) {
    try {
        // Fetch user context
        const neuroProfiles = await base44.asServiceRole.entities.UserNeuroProfile.filter({
            user_email: user.email
        });
        const neuroProfile = neuroProfiles?.[0] || {};
        const complaintHistory = neuroProfile?.complaint_history || [];
        
        // Fetch performance baselines
        const baselines = await base44.asServiceRole.entities.PerformanceBaseline.filter({
            user_email: user.email
        });
        
        // Calculate estimated duration based on frequency
        const frequencyMap = {
            '2_3_times_week': 8,
            '4_5_times_week': 6,
            'daily': 4
        };
        const estimated_duration_weeks = frequencyMap[training_frequency] || 8;
        
        // Build context for LLM
        let contextInfo = `User Goal: ${goal_description}\n`;
        contextInfo += `Training Frequency: ${training_frequency}\n`;
        contextInfo += `Estimated Duration: ${estimated_duration_weeks} weeks\n\n`;
        
        if (baselines.length > 0) {
            contextInfo += `Current Performance Baselines:\n`;
            baselines.forEach(b => {
                contextInfo += `- ${b.test_name}: ${b.result_value} ${b.result_unit} (Level: ${b.baseline_level})\n`;
            });
            contextInfo += '\n';
        }
        
        if (complaintHistory.length > 0) {
            contextInfo += `Active Complaints:\n`;
            complaintHistory.forEach(c => {
                if (c.status === 'active') {
                    contextInfo += `- ${c.location} (Intensity: ${c.intensity}/10)\n`;
                }
            });
            contextInfo += '\n';
        }
        
        const prompt = `${contextInfo}
Create a detailed 3-phase training plan to achieve: "${goal_description}"

CRITICAL REQUIREMENTS:
1. Exercises MUST be 100% SPECIFIC to the goal "${goal_description}" - NOT generic pull-up progressions
2. If goal is "Pistol Squat" → squat progressions, single-leg work, ankle/hip mobility
3. If goal is "Handstand" → wrist prep, shoulder stability, wall handstand progressions, kick-up drills
4. If goal is "10 Klimmzüge" → pull-up progressions (negatives, bands, assisted, full pull-ups)
5. If goal is "Middle Split" → hip mobility, adductor stretching, active flexibility
6. Take into account user's current baselines and complaints
7. Use AXON methodology: Hardware (Mobility) → Software (Neuro-Reset) → Integration (Strength)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "phases": [
    {
      "phase_number": 1,
      "title": "Phase title in German",
      "description": "Phase description in German - explain the focus",
      "duration_weeks": ${Math.ceil(estimated_duration_weeks / 3)},
      "exercises": [
        {
          "exercise_id": "unique_id_lowercase",
          "name": "Exercise name in German - SPECIFIC to the goal",
          "sets_reps_tempo": "e.g. 3 Sets × 8-12 Reps @ 2-1-2 Tempo",
          "instruction": "Detailed step-by-step instruction in German (5-8 sentences)",
          "notes": "Why this exercise and what to focus on (2-3 sentences in German)",
          "cues": ["Cue 1", "Cue 2", "Cue 3", "Cue 4", "Cue 5"],
          "common_mistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
          "progression_strategy": "How to progress this exercise (in German)",
          "progression_milestones": [
            {"level": "Woche 1-2", "description": "description"},
            {"level": "Woche 3-4", "description": "description"}
          ],
          "expert_insight": {
            "quote": "Expert quote",
            "source": "Source name - Methodology",
            "explanation": "Why this matters (in German)"
          },
          "scientific_background": "Scientific explanation in German",
          "fms_relevance": "How it relates to movement patterns (in German)",
          "deload_protocol": "What to do when overtrained (in German)"
        }
      ]
    }
  ]
}

Each phase should have 3-4 exercises. Make phases progressive (Phase 1 = Foundation, Phase 2 = Build Strength, Phase 3 = Mastery).`;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    phases: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                phase_number: { type: "integer" },
                                title: { type: "string" },
                                description: { type: "string" },
                                duration_weeks: { type: "integer" },
                                exercises: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            exercise_id: { type: "string" },
                                            name: { type: "string" },
                                            sets_reps_tempo: { type: "string" },
                                            instruction: { type: "string" },
                                            notes: { type: "string" },
                                            cues: { type: "array", items: { type: "string" } },
                                            common_mistakes: { type: "array", items: { type: "string" } },
                                            progression_strategy: { type: "string" },
                                            progression_milestones: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        level: { type: "string" },
                                                        description: { type: "string" }
                                                    }
                                                }
                                            },
                                            expert_insight: {
                                                type: "object",
                                                properties: {
                                                    quote: { type: "string" },
                                                    source: { type: "string" },
                                                    explanation: { type: "string" }
                                                }
                                            },
                                            scientific_background: { type: "string" },
                                            fms_relevance: { type: "string" },
                                            deload_protocol: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        return response.phases || [];
    } catch (error) {
        console.error('Error generating plan phases via LLM:', error);
        throw error;
    }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_description, training_frequency, replaceExisting } = await req.json();

    // Lösche alte aktive Pläne, um nur einen aktiven Plan zu haben
    const existingPlans = await base44.asServiceRole.entities.TrainingPlan.filter({
      user_email: user.email,
      status: 'active'
    });

    if (existingPlans && existingPlans.length > 0) {
      console.log('Deleting existing active plans:', existingPlans.length);
      for (const plan of existingPlans) {
        await base44.asServiceRole.entities.TrainingPlan.delete(plan.id);
        console.log('Deleted plan:', plan.id);
      }
    }

    // Calculate estimated duration based on frequency
    const frequencyMap = {
      '2_3_times_week': 8,
      '4_5_times_week': 6,
      'daily': 4
    };

    const estimated_duration_weeks = frequencyMap[training_frequency] || 8;

    // Generate plan phases via LLM - goal-specific!
    console.log('Generating goal-specific plan phases via LLM for:', goal_description);
    const phases = await generateTrainingPlanPhases(user, goal_description, training_frequency, base44);

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