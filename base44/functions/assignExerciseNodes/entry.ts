import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Mapping: exercise_id / keywords → correct affected_nodes
// Based on Stecco anatomy + exercise category + body area
const EXERCISE_NODE_MAP = {
  // Shoulder / Thorax / Cervical
  'MOB_SHO_001': ['TH-A', 'LU-P'],   // Wall Circles - shoulder/thorax
  'MOB_SHO_002': ['CP-P', 'TH-A'],   // Cervical/shoulder
  'MOB_THO_001': ['TH-A', 'TH-P'],   // Thoracic mobility
  'MOB_THO_002': ['TH-A', 'TH-P'],
  'MOB_CER_001': ['CP-P', 'CL-P'],   // Cervical
  
  // Ankle / Calf / Foot
  'MOB_ANK_001': ['TA-A', 'TA-P'],   // Eccentric Calf - ankle/calf
  'MOB_ANK_002': ['TA-A', 'PE-A'],
  
  // Hip / Pelvis / Lumbar
  'MOB_HIP_001': ['CX-A', 'CX-P'],   // Hip mobility
  'MOB_HIP_002': ['PV-P', 'CX-A'],
  'MOB_LUM_001': ['LU-A', 'LU-P'],   // Lumbar
  'MOB_LUM_002': ['LU-A', 'LU-P'],
  
  // Core
  'BW_COR_001_DYN': ['LU-P', 'PV-P'], // Core - lumbar/pelvis
  'BW_COR_001': ['LU-P', 'PV-P'],
  'BW_COR_002': ['LU-P', 'LU-A'],
};

// Keyword-based fallback mapping using exercise name/description
const KEYWORD_NODE_MAP = [
  { keywords: ['schulter', 'shoulder', 'rotator', 'supraspinatus'], nodes: ['TH-A', 'LU-P'] },
  { keywords: ['nacken', 'cervical', 'hws', 'kopf', 'kiefer', 'jaw', 'neck'], nodes: ['CP-P', 'CL-P'] },
  { keywords: ['brustwirbel', 'thorax', 'thoracic', 'bwk', 'oberer rücken'], nodes: ['TH-A', 'TH-P'] },
  { keywords: ['lendenwirbel', 'lws', 'lumbar', 'unterer rücken', 'lower back'], nodes: ['LU-A', 'LU-P'] },
  { keywords: ['becken', 'pelvis', 'iliosakral', 'sakrum', 'pelvic'], nodes: ['PV-P', 'LU-P'] },
  { keywords: ['hüfte', 'hip', 'iliopsoas', 'hüftbeuger', 'coxa'], nodes: ['CX-A', 'CX-P'] },
  { keywords: ['knie', 'knee', 'quadrizeps', 'rectus femoris', 'patella', 'genu'], nodes: ['GE-A', 'GE-P'] },
  { keywords: ['wade', 'calf', 'gastrocnemius', 'soleus', 'achilles', 'unterschenkel'], nodes: ['TA-P', 'TA-A'] },
  { keywords: ['fuß', 'foot', 'sprunggelenk', 'ankle', 'plantar', 'fußgewölbe'], nodes: ['TA-A', 'PE-A'] },
  { keywords: ['zehen', 'toe', 'fußrücken', 'metatarsal'], nodes: ['PE-A'] },
  { keywords: ['seitliche hüfte', 'trochanter', 'gluteus medius', 'it-band', 'iliotibial', 'lateral hip'], nodes: ['LA-CX'] },
  { keywords: ['brust', 'chest', 'pectoralis', 'brustmuskel'], nodes: ['TH-A', 'HU-A'] },
  { keywords: ['arm', 'bizeps', 'trizeps', 'ellbogen', 'elbow', 'biceps', 'triceps'], nodes: ['HU-A', 'CU-A'] },
  { keywords: ['handgelenk', 'wrist', 'unterarm', 'forearm', 'carpal'], nodes: ['CU-A', 'CA-A'] },
  { keywords: ['po', 'gesäß', 'glute', 'gluteus', 'piriformis'], nodes: ['CX-P', 'PV-P'] },
  { keywords: ['hamstring', 'oberschenkel hinten', 'biceps femoris', 'semimembranosus'], nodes: ['GE-P', 'CX-P'] },
  { keywords: ['oberschenkel vorne', 'quadriceps', 'vastus', 'quads'], nodes: ['GE-A', 'CX-A'] },
  { keywords: ['rücken', 'back', 'erector spinae', 'rückenstrecker'], nodes: ['TH-P', 'LU-P'] },
  { keywords: ['atemübung', 'breath', 'atmung', 'zwerchfell', 'diaphragm'], nodes: ['TH-A', 'LU-A'] },
  { keywords: ['neuro', 'sakkadentraining', 'vestibulär', 'gleichgewicht', 'balance'], nodes: ['CP-P'] },
];

// Valid node IDs
const VALID_NODES = new Set([
  'CP-P', 'CL-P', 'TH-P', 'LU-P', 'PV-P', 'HU-A', 'CU-A', 'CA-A',
  'TH-A', 'LU-A', 'CX-A', 'CX-P', 'GE-A', 'GE-P', 'TA-A', 'TA-P', 'PE-A', 'LA-CX'
]);

function getNodesFromKeywords(exercise) {
  const text = [
    exercise.name || '',
    exercise.description || '',
    exercise.stecco_chain || '',
    exercise.body_area || '',
    exercise.category || ''
  ].join(' ').toLowerCase();

  for (const entry of KEYWORD_NODE_MAP) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      return entry.nodes;
    }
  }
  return null;
}

function getCorrectNodes(exercise) {
  // 1. Direct ID mapping
  if (EXERCISE_NODE_MAP[exercise.exercise_id]) {
    return EXERCISE_NODE_MAP[exercise.exercise_id];
  }

  // 2. Keyword fallback
  const fromKeywords = getNodesFromKeywords(exercise);
  if (fromKeywords) return fromKeywords;

  // 3. Stecco chain fallback
  const chain = (exercise.stecco_chain || '').toUpperCase();
  if (chain.includes('SFL')) return ['TH-A', 'LU-A'];
  if (chain.includes('SBL')) return ['TH-P', 'LU-P'];
  if (chain.includes('LL')) return ['TH-A', 'TH-P'];
  if (chain.includes('SL') || chain.includes('SPL')) return ['TH-A', 'CX-A'];

  return null;
}

function hasInvalidNodes(nodes) {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return true;
  return nodes.some(n => !VALID_NODES.has(n));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false; // default: dry run

    const exercises = await base44.asServiceRole.entities.Exercise.list();
    
    const updates = [];
    const skipped = [];

    for (const ex of exercises) {
      const currentNodes = ex.affected_nodes || [];
      const hasInvalid = hasInvalidNodes(currentNodes);
      
      const correctNodes = getCorrectNodes(ex);

      if (!correctNodes) {
        skipped.push({ exercise_id: ex.exercise_id, name: ex.name, reason: 'No mapping found' });
        continue;
      }

      // Only update if nodes are empty or contain invalid node IDs
      if (hasInvalid) {
        updates.push({
          id: ex.id,
          exercise_id: ex.exercise_id,
          name: ex.name,
          old_nodes: currentNodes,
          new_nodes: correctNodes,
        });

        if (!dry_run) {
          await base44.asServiceRole.entities.Exercise.update(ex.id, {
            affected_nodes: correctNodes
          });
        }
      }
    }

    return Response.json({
      success: true,
      dry_run,
      total_exercises: exercises.length,
      updates_count: updates.length,
      skipped_count: skipped.length,
      updates,
      skipped,
      message: dry_run
        ? `Dry Run: ${updates.length} Exercises würden aktualisiert.`
        : `Migriert: ${updates.length} Exercises aktualisiert.`
    });

  } catch (error) {
    console.error('assignExerciseNodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});