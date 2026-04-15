import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Auto-Patch: Ordnet MFR-Steps in Routinen automatisch die korrekten node_ids zu.
 * 
 * Mapping-Logik:
 * 1. exercise_name → bekannte Node-Zuordnung (z.B. "Pectoralis Minor Release" → TH-A)
 * 2. affected_nodes aus Exercise-Entity falls exercise_id vorhanden
 * 3. Keyword-Matching im exercise_name
 */

// Direkte exercise_name → node_id Mappings (Vollnamen aus der DB)
const DIRECT_NAME_MAPPINGS = {
  'pectoralis minor release': 'TH-A',
  'brustwirbelsaule release': 'TH-P',
  'brustwirbelsäule release': 'TH-P',
  'bws release': 'TH-P',
  'subokzipitaler release': 'CP-P',
  'parasternaler release': 'TH-A',
  'fussohlen release': 'PE-A',
  'fußsohlen release': 'PE-A',
  'schulterblatt release': 'TH-P',
  'it-band release': 'GE-P',
  'wadenrelease': 'TA-P',
  'wadenmuskel release': 'TA-P',
  'hüftbeuger release': 'CX-A',
  'huftbeuger release': 'CX-A',
  'gesaß release': 'CX-P',
  'gesäß release': 'CX-P',
  'nacken release': 'CP-P',
  'thorakaler release': 'TH-P',
};

// Keyword-Mappings für teilweise Matches
const EXERCISE_NAME_TO_NODE = {
  // Lumbar / unterer Rücken
  'lumbar': 'LU-P',
  'lws': 'LU-P',
  'lower back': 'LU-P',
  'unterer rücken': 'LU-P',
  'quadratus': 'LU-P',
  'ql': 'LU-P',
  
  // Thoracic / oberer Rücken
  'thoracic': 'TH-P',
  'bws': 'TH-P',
  'oberer rücken': 'TH-P',
  'rhomboid': 'TH-P',
  'trapezius': 'TH-P',
  
  // Hüfte anterior
  'hüftbeuger': 'CX-A',
  'hip flexor': 'CX-A',
  'psoas': 'CX-A',
  'iliopsoas': 'CX-A',
  'leiste': 'CX-A',
  
  // Hüfte posterior / Gesäß
  'glute': 'CX-P',
  'gesäß': 'CX-P',
  'piriformis': 'CX-P',
  'gluteal': 'CX-P',
  'hüfte rück': 'CX-P',
  
  // Oberschenkel anterior
  'quad': 'GE-A',
  'rectus': 'GE-A',
  'vastus': 'GE-A',
  'oberschenkel vorn': 'GE-A',
  
  // Oberschenkel posterior
  'hamstring': 'GE-P',
  'ischio': 'GE-P',
  'biceps femoris': 'GE-P',
  'oberschenkel hint': 'GE-P',
  
  // Unterschenkel anterior
  'tibialis': 'TA-A',
  'shin': 'TA-A',
  'schienbein': 'TA-A',
  
  // Unterschenkel posterior / Wade
  'calf': 'TA-P',
  'wade': 'TA-P',
  'gastrocnemius': 'TA-P',
  'soleus': 'TA-P',
  'achilles': 'TA-P',
  
  // Fuß anterior
  'fußrücken': 'PE-A',
  'zehen': 'PE-A',
  'metatarsal': 'PE-A',
  
  // Kopf / Nacken / Schädelbasis
  'nacken': 'CP-P',
  'neck': 'CP-P',
  'subokzipital': 'CP-P',
  'suboccipital': 'CP-P',
  'cervical': 'CP-P',
  'schädelbasis': 'CP-P',
  'okzipit': 'CP-P',
  
  // Thorax anterior (Brustbein, Sternum, Pec)
  'pectoralis': 'TH-A',
  'pectoral': 'TH-A',
  'brust': 'TH-A',
  'chest': 'TH-A',
  'parasternal': 'TH-A',
  'brustbein': 'TH-A',
  'sternum': 'TH-A',
  
  // Thorax posterior (BWS / Schaumrolle)
  'brustwirbel': 'TH-P',
  'bws': 'TH-P',
  'schaumrolle': 'TH-P',
  'foam roll': 'TH-P',
  'thoracic': 'TH-P',
};

function matchNodeFromName(exerciseName) {
  if (!exerciseName) return null;
  // Normalize: lowercase + remove diacritics for robust matching
  const normalize = (s) => s.toLowerCase()
    .replace(/\u00e4/g, 'a').replace(/\u00f6/g, 'o').replace(/\u00fc/g, 'u')
    .replace(/\u00df/g, 'ss').replace(/\u2014/g, ' ');
  
  const normalizedName = normalize(exerciseName);
  
  // Step 1: Check direct name mappings (most reliable)
  for (const [directName, nodeId] of Object.entries(DIRECT_NAME_MAPPINGS)) {
    if (normalizedName.includes(normalize(directName))) {
      return nodeId;
    }
  }
  
  // Step 2: Keyword matching
  for (const [keyword, nodeId] of Object.entries(EXERCISE_NAME_TO_NODE)) {
    if (normalizedName.includes(normalize(keyword))) {
      return nodeId;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // Default: true (sicher)
    
    const VERSION = 'v3.0';
    
    if (body.debug) {
      const testResult = matchNodeFromName("Pectoralis Minor Release");
      const testResult2 = matchNodeFromName("Brustwirbels\u00e4ule Release \u2014 Schaumrolle");
      return Response.json({ 
        debug: true, 
        pectoralis: testResult, 
        brustwirbel: testResult2,
        version: VERSION
      });
    }

    // Alle Routinen laden
    const routines = await base44.asServiceRole.entities.Routine.list();
    
    // Alle Exercises laden für exercise_id → affected_nodes Lookup
    const exercises = await base44.asServiceRole.entities.Exercise.list();
    const exerciseMap = {};
    for (const ex of exercises) {
      if (ex.exercise_id) {
        exerciseMap[ex.exercise_id] = ex;
      }
    }

    // Alle MFR Nodes laden für Validierung
    const mfrNodes = await base44.asServiceRole.entities.MFRNode.list();
    const validNodeIds = new Set(mfrNodes.map(n => n.node_id));

    const results = {
      routines_scanned: 0,
      mfr_steps_found: 0,
      already_mapped: 0,
      newly_mapped: 0,
      unmapped: 0,
      updates: [],
      unmapped_exercises: [],
    };

    for (const routine of routines) {
      results.routines_scanned++;
      
      if (!routine.sequence || !Array.isArray(routine.sequence)) continue;

      let needsUpdate = false;
      const updatedSequence = routine.sequence.map((step, idx) => {
        // Nur MFR-Steps ohne node_id behandeln
        if (step.type !== 'mfr') return step;
        
        results.mfr_steps_found++;
        
        if (step.node_id && validNodeIds.has(step.node_id)) {
          results.already_mapped++;
          return step;
        }

        // Versuch 1: exercise_id → Exercise.affected_nodes
        let matchedNode = null;
        if (step.exercise_id && exerciseMap[step.exercise_id]) {
          const ex = exerciseMap[step.exercise_id];
          if (ex.affected_nodes && ex.affected_nodes.length > 0) {
            matchedNode = ex.affected_nodes[0]; // Primärer Node
          }
        }

        // Versuch 2: exercise_name Keyword-Matching
        if (!matchedNode && step.exercise_name) {
          matchedNode = matchNodeFromName(step.exercise_name);
        }

        // Versuch 3: instruction/exercise_description Keyword-Matching
        if (!matchedNode) {
          const combinedText = `${step.instruction || ''} ${step.exercise_description || ''}`;
          matchedNode = matchNodeFromName(combinedText);
        }

        if (matchedNode && validNodeIds.has(matchedNode)) {
          results.newly_mapped++;
          needsUpdate = true;
          
          results.updates.push({
            routine_name: routine.routine_name,
            step_index: idx,
            exercise_name: step.exercise_name,
            assigned_node: matchedNode,
          });
          
          return { ...step, node_id: matchedNode };
        } else {
          results.unmapped++;
          results.unmapped_exercises.push({
            routine_name: routine.routine_name,
            step_index: idx,
            exercise_name: step.exercise_name || '(kein Name)',
          });
          return step;
        }
      });

      // Update durchführen wenn nicht dry_run
      if (needsUpdate && !dryRun) {
        await base44.asServiceRole.entities.Routine.update(routine.id, {
          sequence: updatedSequence,
        });
      }
    }

    return Response.json({
      success: true,
      version: VERSION,
      dry_run: dryRun,
      summary: results,
      message: dryRun 
        ? `Dry Run: ${results.newly_mapped} MFR-Steps würden gepatcht werden. Setze dry_run=false zum Ausführen.`
        : `${results.newly_mapped} MFR-Steps wurden erfolgreich gepatcht.`,
    });

  } catch (error) {
    console.error('patchRoutineMfrNodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});