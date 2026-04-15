import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Korrigierter AXON Exercise Node Datensatz (35 Exercises)
// Fixes: CU-P (Trizeps) bei Push, HU-P (hintere Schulter) bei Pull,
//        reine Rumpf-Nodes bei Core, korrekte Fuß/Wade-Nodes
const CORRECT_NODE_MAP = [
  { exercise_id: "BW_COR_001_DYN", nodes: ["LU-A", "LU-P", "PV-P", "TH-P"] },
  { exercise_id: "BW_COR_002_DYN", nodes: ["LU-A", "LU-P", "PV-P", "TH-P"] },
  { exercise_id: "BW_COR_005",     nodes: ["LU-A", "LU-P", "PV-P", "TH-P"] },
  { exercise_id: "BW_GEN_015",     nodes: ["TH-A", "LU-A"] },
  { exercise_id: "ST_NEU_001",     nodes: ["CP-P", "TH-P"] },  // CP-A existiert nicht → CP-P
  { exercise_id: "NR_TGU_001",     nodes: ["HU-A", "CA-A", "LU-A", "PV-P", "CX-A"] },
  { exercise_id: "ST_PSH_001",     nodes: ["TH-A", "HU-A", "CU-P"] },
  { exercise_id: "ST_PSH_002",     nodes: ["TH-A", "HU-A", "CU-P"] },
  { exercise_id: "BW_PSH_006",     nodes: ["TH-A", "HU-A", "CU-P", "LU-A"] },
  { exercise_id: "KB_SHO_002",     nodes: ["TH-A", "HU-A", "CU-P", "CA-A"] },
  { exercise_id: "ST_PUL_002",     nodes: ["TH-P", "HU-P", "CU-A", "CA-A", "LU-A"] },
  { exercise_id: "BW_PUL_002",     nodes: ["TH-P", "HU-P", "CU-A", "CA-A"] },
  { exercise_id: "BW_PUL_003",     nodes: ["TH-P", "HU-P", "CU-A", "CA-A"] },
  { exercise_id: "KB_PUL_001",     nodes: ["TH-P", "HU-P", "CU-A", "CA-A"] },
  { exercise_id: "BW_SHO_005",     nodes: ["TH-P", "HU-P"] },
  { exercise_id: "KB_A_004",       nodes: ["CX-P", "TH-P", "HU-P", "CU-A"] },
  { exercise_id: "ST_HIN_001",     nodes: ["GE-P", "CX-P", "TA-P"] },
  { exercise_id: "KB_HIN_001",     nodes: ["CX-P", "GE-P", "LU-P", "TA-P"] },
  { exercise_id: "KB_HIN_002",     nodes: ["CX-P", "GE-P", "LU-P", "TA-P", "LU-A"] },
  { exercise_id: "KB_A_001",       nodes: ["CX-P", "GE-P", "LU-P", "TA-P"] },
  { exercise_id: "KB_A_003",       nodes: ["CX-P", "GE-P", "LU-P", "TA-P"] },
  { exercise_id: "BW_HIP_004",     nodes: ["CX-P", "GE-P", "LU-P"] },
  { exercise_id: "KB_SQU_001",     nodes: ["GE-A", "CX-P", "TA-A", "TA-P", "TH-P"] },
  { exercise_id: "KB_SQU_002",     nodes: ["GE-A", "CX-P", "TA-A", "TA-P", "TH-P"] },
  { exercise_id: "ST_SQU_001",     nodes: ["GE-A", "CX-P", "TA-A", "TA-P"] },
  { exercise_id: "ST_SQU_002",     nodes: ["GE-A", "CX-P", "TA-A", "TA-P"] },
  { exercise_id: "BW_BAL_001",     nodes: ["TA-A"] },
  { exercise_id: "KB_GEN_001",     nodes: ["CA-A", "PV-P", "LU-A", "HU-A"] },
  { exercise_id: "KB_GEN_002",     nodes: ["CA-A", "PV-P", "LU-A", "HU-A"] },
  { exercise_id: "KB_GEN_005",     nodes: ["CA-A", "HU-A", "LU-A", "PV-P", "CX-P"] },
  { exercise_id: "MOB_ANK_001",    nodes: ["TA-P", "PE-A"] },
  { exercise_id: "MOB_SHO_001",    nodes: ["TH-P", "HU-A", "HU-P"] },
  { exercise_id: "MB_SPI_002",     nodes: ["TH-P", "LU-A", "CP-P"] },
  { exercise_id: "BW_LAT_001",     nodes: ["LU-A", "PV-P", "TH-P"] },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;

    // Alle Exercises laden
    const exercises = await base44.asServiceRole.entities.Exercise.list();
    console.log(`Loaded ${exercises.length} exercises`);

    // Index nach exercise_id
    const exerciseIndex = {};
    for (const ex of exercises) {
      if (ex.exercise_id) exerciseIndex[ex.exercise_id] = ex;
    }

    const report = {
      dry_run: dryRun,
      total_patch_entries: CORRECT_NODE_MAP.length,
      updated: 0,
      not_found: [],
      unchanged: 0,
      changes: [],
    };

    for (const entry of CORRECT_NODE_MAP) {
      const ex = exerciseIndex[entry.exercise_id];

      if (!ex) {
        console.log(`NOT FOUND: ${entry.exercise_id}`);
        report.not_found.push(entry.exercise_id);
        continue;
      }

      const oldNodes = (ex.affected_nodes || []).slice().sort().join(',');
      const newNodes = entry.nodes.slice().sort().join(',');

      if (oldNodes === newNodes) {
        report.unchanged++;
        continue;
      }

      report.changes.push({
        exercise_id: entry.exercise_id,
        name: ex.name,
        old_nodes: ex.affected_nodes || [],
        new_nodes: entry.nodes,
      });

      if (!dryRun) {
        await base44.asServiceRole.entities.Exercise.update(ex.id, {
          affected_nodes: entry.nodes,
        });
      }

      report.updated++;
    }

    console.log(`Done. updated=${report.updated}, not_found=${report.not_found.length}, dry_run=${dryRun}`);
    return Response.json(report);

  } catch (error) {
    console.error('patchExerciseNodesFinal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});