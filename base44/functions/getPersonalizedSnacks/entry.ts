import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── Fascial Line Tagging ──────────────────────────────────────────────────────
// Maps snack type → most relevant Stecco-MFR nodes for cool-down targeting
const SNACK_TYPE_TO_NODES = {
  hiit:           ['GE-A', 'GE-P', 'LU-A'],   // Quad/Hamstring/Hip Flexor
  sprint:         ['TA-P', 'GE-P', 'CX-P'],   // Calf/Hamstring/Glute
  zone2:          ['TA-P', 'GE-P', 'LU-P'],   // Calf/Hamstring/Lower Back
  strength_snack: ['LU-P', 'CX-P', 'TH-P'],  // Lower Back/Glute/Mid Back
  mobility_snack: ['LU-A', 'CX-A', 'TH-A'],  // Hip Flexor/Anterior Chain
  breathwork:     ['TH-A', 'CP-P', 'TH-P'],  // Thorax/Neck
  cold_exposure:  ['CP-P', 'TH-A'],           // Neck/Parasympathetic
  heat:           ['CP-P', 'TH-P'],           // Neck/Upper Back
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];

  // Fetch readiness, profile, rehab in parallel
  const [readinessArr, profileArr, rehabArr, allSnacks, allMFRNodes] = await Promise.all([
    base44.entities.ReadinessCheck.filter({ user_email: user.email, check_date: today }),
    base44.entities.UserNeuroProfile.filter({ user_email: user.email }),
    base44.entities.RehabPlan.filter({ user_email: user.email }),
    base44.entities.FitnessSnack.list(),
    base44.entities.MFRNode.list(),
  ]);

  const readiness = readinessArr[0] || null;
  const profile = profileArr[0] || null;
  const rehab = rehabArr[0] || null;

  // Determine readiness status
  let readinessStatus = readiness?.readiness_status || 'green';

  // If rehab is in red_stop mode, downgrade to red
  if (rehab?.intervention_mode === 'red_stop') readinessStatus = 'red';

  // Gate logic: which snacks are allowed?
  const GATE_ORDER = { red: 0, yellow: 1, green: 2, any: -1 };
  const userLevel = GATE_ORDER[readinessStatus] ?? 1;

  const eligible = allSnacks.filter(s => {
    if (!s.is_active && s.is_active !== undefined) return false;
    const gate = s.readiness_gate || 'any';
    // 'any' = always show
    if (gate === 'any') return true;
    // red snacks = only for red state
    if (gate === 'red') return readinessStatus === 'red';
    // yellow snacks = for yellow AND red (they need recovery too)
    if (gate === 'yellow') return userLevel <= 1;
    // green snacks = only for green
    if (gate === 'green') return readinessStatus === 'green';
    return true;
  });

  // Age/gender filter
  const age = profile?.date_of_birth
    ? (() => {
        const today = new Date();
        const b = new Date(profile.date_of_birth);
        let a = today.getFullYear() - b.getFullYear();
        if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() - b.getMonth() === 0 && today.getDate() < b.getDate())) a--;
        return a;
      })()
    : null;
  const gender = profile?.biological_sex || 'diverse';

  const filtered = eligible.filter(s => {
    if (age !== null) {
      if (age < (s.suitable_for_age_min ?? 16) || age > (s.suitable_for_age_max ?? 99)) return false;
    }
    if (s.suitable_for_gender && s.suitable_for_gender !== 'all') {
      if (s.suitable_for_gender === 'male' && gender === 'female') return false;
      if (s.suitable_for_gender === 'female' && gender === 'male') return false;
    }
    return true;
  });

  // Pick 3 with variety (different types)
  const dateStr = today.replace(/-/g, '');
  const seed = parseInt(dateStr) % 997;
  const sorted = [...filtered].sort((a, b) => {
    const ha = ((a.id?.charCodeAt(0) || 0) * 31 + seed) % 100;
    const hb = ((b.id?.charCodeAt(0) || 0) * 31 + seed) % 100;
    return ha - hb;
  });

  const picked = [];
  const usedTypes = new Set();
  for (const s of sorted) {
    if (picked.length >= 3) break;
    if (!usedTypes.has(s.type)) { picked.push(s); usedTypes.add(s.type); }
  }
  for (const s of sorted) {
    if (picked.length >= 3) break;
    if (!picked.includes(s)) picked.push(s);
  }

  // ── Phase 3.1: Fascial Line Tagging ─────────────────────────────────────
  // Build a lookup map for MFR nodes
  const mfrNodeMap = {};
  for (const node of allMFRNodes) {
    if (node.node_id) mfrNodeMap[node.node_id] = node;
  }

  // For each picked snack: find targeted nodes → append MFR cool-down step
  const snacksWithFascialTag = picked.map(snack => {
    const targetNodes = SNACK_TYPE_TO_NODES[snack.type] || [];

    // Find first node that exists in MFRNode DB
    const mfrNode = targetNodes.map(nid => mfrNodeMap[nid]).find(n => n && n.user_instruction);

    if (!mfrNode) return snack;

    // Check if snack already has a mfr_cooldown step
    const existingSequence = snack.sequence || [];
    const hasCooldown = existingSequence.some(s => s.type === 'mfr_cooldown');
    if (hasCooldown) return snack;

    // Build cool-down step from MFR node data
    const cooldownStep = {
      title: `MFR · ${mfrNode.name_de || mfrNode.node_id}`,
      instruction: mfrNode.user_instruction,
      duration_seconds: mfrNode.compression_time_min || 60,
      type: 'mfr_cooldown',
      cue: mfrNode.expert_tip || null,
    };

    return {
      ...snack,
      sequence: [...existingSequence, cooldownStep],
      fascial_tag: {
        node_id: mfrNode.node_id,
        node_name: mfrNode.name_de,
        stecco_chain: mfrNode.target_chain,
      },
    };
  });

  return Response.json({
    snacks: snacksWithFascialTag,
    readiness_status: readinessStatus,
    readiness_score: readiness?.readiness_score || null,
    has_readiness_today: !!readiness,
    total_eligible: filtered.length,
  });
});