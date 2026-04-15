import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================
// AXON Node-Mapping-Algorithmus v2
// Weist jedem Bewegungsmuster die korrekten Stecco-Nodes zu
// ============================================================

// --- Basis-Nodes nach Kategorie (Dan John Muster) ---
const CATEGORY_BASE_NODES = {
  push:     ['TH-A', 'HU-A', 'CU-A'],
  pull:     ['TH-P', 'HU-A', 'CU-A', 'CA-A'],
  hinge:    ['CX-P', 'GE-P', 'LU-P'],
  squat:    ['GE-A', 'CX-P', 'TA-A'],
  carry:    ['CA-A', 'PV-P', 'LU-P', 'HU-A'],
  core:     ['LU-A', 'LU-P', 'PV-P', 'TH-P'],
  mobility: ['TH-A', 'TH-P', 'CX-A'],   // Fallback; Keyword-Rules überschreiben spezifisch
  mfr:      [],  // MFR-Nodes bleiben unverändert
  neuro:    [],
  breath:   ['TH-A', 'LU-A'],
  other:    [],
};

// --- Keyword-Overrides: spezifische Exercises erhalten präzisere Nodes ---
// Format: { match (lowercase substring oder regex), nodes: [...], replace: bool }
// replace: true = ersetzt Basis-Nodes komplett; false = fügt hinzu
const KEYWORD_RULES = [
  // PUSH – vertikal (Overhead / Handstand)
  { match: 'handstand',          nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'overhead press',     nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'pike push',          nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'shoulder press',     nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'military press',     nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'bottom-up press',    nodes: ['TH-A', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'bottom up press',    nodes: ['TH-A', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  // PUSH – horizontal (Liegestütz / Bench)
  { match: 'push-up',            nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'push up',            nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'pushup',             nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'bench press',        nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'chest press',        nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'dip',                nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  // PUSH – spiderman / complex
  { match: 'spiderman',          nodes: ['TH-A', 'HU-A', 'CX-A', 'LU-A'],     replace: true },
  // PULL – vertikal
  { match: 'pull-up',            nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'pull up',            nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'pullup',             nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'chin-up',            nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'chin up',            nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'lat pulldown',       nodes: ['TH-P', 'HU-A', 'CU-A'],              replace: true },
  // PULL – horizontal
  { match: 'row',                nodes: ['TH-P', 'HU-A', 'CU-A', 'CA-A'],     replace: true },
  { match: 'high pull',          nodes: ['CX-P', 'TH-P', 'HU-A'],              replace: true },
  { match: 'face pull',          nodes: ['TH-P', 'HU-A', 'CU-A'],              replace: true },
  // HINGE
  { match: 'deadlift',           nodes: ['CX-P', 'GE-P', 'LU-P', 'TA-P'],     replace: true },
  { match: 'romanian',           nodes: ['CX-P', 'GE-P', 'LU-P'],              replace: true },
  { match: 'rdl',                nodes: ['CX-P', 'GE-P', 'LU-P'],              replace: true },
  { match: 'swing',              nodes: ['CX-P', 'GE-P', 'LU-P'],              replace: true },
  { match: 'glute bridge',       nodes: ['CX-P', 'GE-P', 'LU-P', 'PV-P'],     replace: true },
  { match: 'hip thrust',         nodes: ['CX-P', 'GE-P', 'LU-P', 'PV-P'],     replace: true },
  { match: 'good morning',       nodes: ['CX-P', 'GE-P', 'LU-P'],              replace: true },
  { match: 'stiff leg',          nodes: ['CX-P', 'GE-P', 'LU-P'],              replace: true },
  { match: 'snatch',             nodes: ['CX-P', 'TH-P', 'HU-A', 'LU-P'],     replace: true },
  { match: 'clean',              nodes: ['CX-P', 'TH-P', 'HU-A', 'LU-P'],     replace: true },
  // SQUAT
  { match: 'goblet squat',       nodes: ['GE-A', 'CX-P', 'TA-A', 'LU-A'],     replace: true },
  { match: 'pistol squat',       nodes: ['GE-A', 'CX-P', 'TA-A', 'PV-P'],     replace: true },
  { match: 'pistol',             nodes: ['GE-A', 'CX-P', 'TA-A', 'PV-P'],     replace: true },
  { match: 'sissy squat',        nodes: ['GE-A'],                               replace: true },
  { match: 'sissi squat',        nodes: ['GE-A'],                               replace: true },
  { match: 'front squat',        nodes: ['GE-A', 'CX-P', 'TA-A', 'TH-A'],     replace: true },
  { match: 'back squat',         nodes: ['GE-A', 'CX-P', 'TA-A', 'LU-P'],     replace: true },
  { match: 'lunge',              nodes: ['GE-A', 'CX-P', 'CX-A', 'TA-A'],     replace: true },
  { match: 'split squat',        nodes: ['GE-A', 'CX-A', 'TA-A'],              replace: true },
  { match: 'step-up',            nodes: ['GE-A', 'CX-P', 'TA-A'],              replace: true },
  { match: 'step up',            nodes: ['GE-A', 'CX-P', 'TA-A'],              replace: true },
  { match: 'jump squat',         nodes: ['GE-A', 'CX-P', 'TA-A', 'TA-P'],     replace: true },
  { match: 'box squat',          nodes: ['GE-A', 'CX-P', 'LU-P'],              replace: true },
  // CARRY
  { match: 'carry',              nodes: ['CA-A', 'PV-P', 'LU-P', 'HU-A'],     replace: true },
  { match: 'farmer',             nodes: ['CA-A', 'PV-P', 'LU-P', 'HU-A'],     replace: true },
  { match: 'suitcase',           nodes: ['CA-A', 'PV-P', 'LU-P', 'LA-CX'],    replace: true },
  { match: 'rack walk',          nodes: ['CA-A', 'PV-P', 'HU-A', 'TH-A'],     replace: true },
  { match: 'waiter walk',        nodes: ['CA-A', 'HU-A', 'TH-A', 'PV-P'],     replace: true },
  // CORE
  { match: 'plank',              nodes: ['LU-A', 'PV-P', 'TH-P'],              replace: true },
  { match: 'dead bug',           nodes: ['LU-A', 'PV-P', 'TH-A'],              replace: true },
  { match: 'bird dog',           nodes: ['LU-A', 'PV-P', 'TH-P', 'CX-P'],     replace: true },
  { match: 'bird-dog',           nodes: ['LU-A', 'PV-P', 'TH-P', 'CX-P'],     replace: true },
  { match: 'mcgill',             nodes: ['LU-A', 'LU-P', 'PV-P'],              replace: true },
  { match: 'side plank',         nodes: ['LU-A', 'PV-P', 'LA-CX'],             replace: true },
  { match: 'hollow body',        nodes: ['LU-A', 'PV-P', 'TH-A'],              replace: true },
  { match: 'ab wheel',           nodes: ['LU-A', 'TH-A', 'HU-A'],              replace: true },
  { match: 'crunch',             nodes: ['LU-A', 'TH-A'],                       replace: true },
  { match: 'sit-up',             nodes: ['LU-A', 'TH-A', 'CX-A'],              replace: true },
  { match: 'sit up',             nodes: ['LU-A', 'TH-A', 'CX-A'],              replace: true },
  { match: 'spinal wave',        nodes: ['TH-P', 'LU-A', 'CP-P'],              replace: true },
  { match: 'cat cow',            nodes: ['TH-P', 'LU-A', 'CP-P'],              replace: true },
  { match: 'cat-cow',            nodes: ['TH-P', 'LU-A', 'CP-P'],              replace: true },
  { match: 'rotation',           nodes: ['TH-P', 'LU-A', 'PV-P'],              replace: false },
  // KOMPLEX / GANZKÖRPER
  { match: 'turkish get-up',     nodes: ['HU-A', 'CX-A', 'CX-P', 'LU-A', 'GE-P', 'CA-A'], replace: true },
  { match: 'turkish get up',     nodes: ['HU-A', 'CX-A', 'CX-P', 'LU-A', 'GE-P', 'CA-A'], replace: true },
  { match: 'tgu',                nodes: ['HU-A', 'CX-A', 'CX-P', 'LU-A', 'GE-P', 'CA-A'], replace: true },
  { match: 'getup',              nodes: ['HU-A', 'CX-A', 'CX-P', 'LU-A', 'GE-P', 'CA-A'], replace: true },
  { match: 'get-up',             nodes: ['HU-A', 'CX-A', 'CX-P', 'LU-A', 'GE-P', 'CA-A'], replace: true },
  { match: 'windmill',           nodes: ['TH-P', 'HU-A', 'CX-P', 'LU-P'],     replace: true },
  { match: 'burpee',             nodes: ['TH-A', 'HU-A', 'CX-P', 'GE-A', 'TA-A'], replace: true },
  // BEIN – spezifisch
  { match: 'hamstring curl',     nodes: ['GE-P', 'TA-P', 'CX-P'],              replace: true },
  { match: 'leg curl',           nodes: ['GE-P', 'TA-P'],                       replace: true },
  { match: 'leg extension',      nodes: ['GE-A'],                               replace: true },
  { match: 'calf raise',         nodes: ['TA-P', 'PE-A'],                       replace: true },
  { match: 'tibialis',           nodes: ['TA-A'],                               replace: true },
  { match: 'wall sit',           nodes: ['GE-A', 'CX-P'],                       replace: true },
  { match: 'nordic curl',        nodes: ['GE-P', 'LU-P', 'TA-P'],              replace: true },
  { match: 'nordic hamstring',   nodes: ['GE-P', 'LU-P', 'TA-P'],              replace: true },
  { match: 'reverse lunge',      nodes: ['GE-A', 'CX-A', 'TA-A'],              replace: true },
  { match: 'lateral lunge',      nodes: ['GE-A', 'CX-A', 'LA-CX', 'TA-A'],    replace: true },
  // MFR / NEURO spezifisch
  { match: 'foam roll',          nodes: [],                                      replace: false },
  { match: 'foam roller',        nodes: [],                                      replace: false },
  { match: 'lacrosse ball',      nodes: [],                                      replace: false },
  { match: 'mfr',                nodes: [],                                      replace: false },
  // BREATH
  { match: 'breath',             nodes: ['TH-A', 'LU-A'],                       replace: true },
  { match: 'breathing',          nodes: ['TH-A', 'LU-A'],                       replace: true },
  { match: 'diaphragm',          nodes: ['TH-A', 'LU-A'],                       replace: true },
  { match: '4-7-8',              nodes: ['TH-A', 'LU-A'],                       replace: true },
  { match: 'box breath',         nodes: ['TH-A', 'LU-A'],                       replace: true },
  // HALS / NACKEN / NEURO (für neuro/mfr exercises)
  { match: 'neck',               nodes: ['CP-P', 'CL-P', 'TH-P'],              replace: true },
  { match: 'sakkaden',           nodes: ['CP-P'],                               replace: true },
  { match: 'augenbewegung',      nodes: ['CP-P'],                               replace: true },
  { match: 'vestibular',         nodes: ['CP-P', 'CL-P'],                       replace: true },
  { match: 'gaze',               nodes: ['CP-P'],                               replace: true },
  { match: 'ocular',             nodes: ['CP-P'],                               replace: true },
  // SCHULTER / MOBILITY
  { match: 'shoulder mobility',  nodes: ['TH-A', 'HU-A', 'TH-P'],              replace: true },
  { match: 'shoulder dislocate', nodes: ['TH-A', 'HU-A', 'CU-A'],              replace: true },
  { match: 'wall slide',         nodes: ['TH-A', 'HU-A', 'TH-P'],              replace: true },
  { match: 'wall angel',         nodes: ['TH-A', 'TH-P', 'HU-A'],              replace: true },
  { match: 'band pull apart',    nodes: ['TH-P', 'HU-A'],                       replace: true },
  { match: 'cars',               nodes: ['TH-A', 'TH-P', 'HU-A', 'CX-A'],     replace: true },
  { match: 'hip car',            nodes: ['CX-A', 'CX-P', 'PV-P'],              replace: true },
  { match: '90/90',              nodes: ['CX-A', 'CX-P', 'LA-CX'],             replace: true },
  { match: 'pigeon',             nodes: ['CX-P', 'LA-CX', 'GE-P'],             replace: true },
  { match: 'hip flexor',         nodes: ['CX-A', 'LU-A'],                       replace: true },
  { match: 'couch stretch',      nodes: ['CX-A', 'GE-A', 'LU-A'],              replace: true },
  // BALANCE / SPRUNGGELENK
  { match: 'balance',            nodes: ['TA-A', 'PE-A', 'CX-P'],              replace: true },
  { match: 'single leg',         nodes: ['GE-A', 'CX-P', 'TA-A', 'PV-P'],     replace: true },
  { match: 'single-leg',         nodes: ['GE-A', 'CX-P', 'TA-A', 'PV-P'],     replace: true },
  // JUMP / PLYOMETRIE
  { match: 'jump',               nodes: ['GE-A', 'TA-A', 'CX-P'],              replace: false },
  { match: 'box jump',           nodes: ['GE-A', 'TA-A', 'CX-P'],              replace: true },
  { match: 'broad jump',         nodes: ['GE-A', 'TA-A', 'CX-P'],              replace: true },
];

// ============================================================
// Hilfsfunktion: Nodes für eine Exercise berechnen
// ============================================================
function computeNodes(exercise) {
  const category = (exercise.category || 'other').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  const id = (exercise.exercise_id || '').toLowerCase();
  const desc = (exercise.description || '').toLowerCase();
  const searchText = `${name} ${id} ${desc}`;

  // MFR exercises: keep existing affected_nodes if set, else empty
  if (category === 'mfr') {
    return exercise.affected_nodes?.length ? exercise.affected_nodes : [];
  }

  // Start with category base nodes
  let baseNodes = [...(CATEGORY_BASE_NODES[category] || [])];
  let applied = false;

  for (const rule of KEYWORD_RULES) {
    if (searchText.includes(rule.match)) {
      if (rule.replace) {
        baseNodes = [...rule.nodes];
        applied = true;
        break; // First matching replace-rule wins
      } else {
        // Additive: merge without duplicates
        for (const n of rule.nodes) {
          if (!baseNodes.includes(n)) baseNodes.push(n);
        }
        applied = true;
      }
    }
  }

  // Deduplicate and return
  return [...new Set(baseNodes)];
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default: dry_run = true
    const categoryFilter = body.category || null; // optional: only process one category

    const exercises = await base44.asServiceRole.entities.Exercise.list();
    console.log(`Loaded ${exercises.length} exercises`);

    const report = {
      dry_run: dryRun,
      total: exercises.length,
      updated: 0,
      unchanged: 0,
      skipped_mfr: 0,
      changes: [],
    };

    for (const ex of exercises) {
      const cat = (ex.category || '').toLowerCase();

      if (categoryFilter && cat !== categoryFilter.toLowerCase()) {
        continue;
      }

      if (cat === 'mfr') {
        report.skipped_mfr++;
        continue;
      }

      const newNodes = computeNodes(ex);
      const oldNodes = ex.affected_nodes || [];

      const oldSorted = [...oldNodes].sort().join(',');
      const newSorted = [...newNodes].sort().join(',');

      if (oldSorted === newSorted) {
        report.unchanged++;
        continue;
      }

      report.changes.push({
        exercise_id: ex.exercise_id,
        name: ex.name,
        category: ex.category,
        old_nodes: oldNodes,
        new_nodes: newNodes,
      });

      if (!dryRun) {
        await base44.asServiceRole.entities.Exercise.update(ex.id, {
          affected_nodes: newNodes,
        });
      }

      report.updated++;
    }

    console.log(`Done. updated=${report.updated}, unchanged=${report.unchanged}, dry_run=${dryRun}`);
    return Response.json(report);

  } catch (error) {
    console.error('rebuildExerciseNodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});