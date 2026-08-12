import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { daysBack = 30 } = await req.json().catch(() => ({}));

    // Fetch data from all relevant sources in parallel
    // RoutineHistory uses created_by RLS — no user_email filter needed
    const [readinessChecks, routineHistory, trainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-check_date', daysBack),
      base44.entities.RoutineHistory.filter({}, '-created_date', 20),
      base44.entities.TrainingPlan.filter({ user_email: user.email }, '-updated_date', 5),
    ]);

    const hasNoData = readinessChecks.length === 0 && routineHistory.length === 0 && trainingPlans.length === 0;

    if (hasNoData) {
      return Response.json({
        success: true,
        message: 'no_data_yet',
        data: {
          user_email: user.email,
          period_days: daysBack,
          latest_stats: null,
          historical_data: [],
          heatmap_nodes: [],
          sling_alerts: [],
          mcs: 0,
        }
      });
    }

    // --- Historical data from ReadinessChecks ---
    const historicalData = [...readinessChecks]
      .sort((a, b) => new Date(a.check_date) - new Date(b.check_date))
      .map(r => ({
        date: r.check_date,
        overall_readiness: Math.round((r.readiness_score / 10) * 100),
        feeling: r.feeling_hardware,
        focus: r.focus_software,
        energy: r.energy_battery,
        status: r.readiness_status,
      }));

    const latestCheck = readinessChecks[0] || null;

    // --- MCS Score: weighted average of the latest readiness check ---
    let mcs = 0;
    if (latestCheck) {
      const weighted =
        (latestCheck.feeling_hardware * 0.4) +
        (latestCheck.focus_software * 0.3) +
        (latestCheck.energy_battery * 0.3);
      mcs = Math.round((weighted / 10) * 100);
    }

    // --- Heatmap nodes: derived from RoutineHistory feedback ---
    const heatmapNodes = buildHeatmapFromHistory(routineHistory);

    // --- Alerts from recent sessions & readiness ---
    const alerts = buildAlerts(routineHistory, latestCheck);

    // --- Latest stats ---
    const latestStats = latestCheck ? {
      date: latestCheck.check_date,
      readiness_score: latestCheck.readiness_score,
      readiness_status: latestCheck.readiness_status,
      feeling_hardware: latestCheck.feeling_hardware,
      focus_software: latestCheck.focus_software,
      energy_battery: latestCheck.energy_battery,
    } : null;

    return Response.json({
      success: true,
      data: {
        user_email: user.email,
        generated_date: new Date().toISOString(),
        period_days: daysBack,
        latest_stats: latestStats,
        historical_data: historicalData,
        heatmap_nodes: heatmapNodes,
        sling_alerts: alerts,
        mcs,
      }
    });

  } catch (error) {
    console.error('Dashboard Data Aggregator Error:', error);
    return Response.json(
      { error: error.message || 'Failed to aggregate dashboard data' },
      { status: 500 }
    );
  }
});

function buildHeatmapFromHistory(routineHistory) {
  const NODE_SLING_MAP = {
    N1: 'lateral', N2: 'anterior', N3: 'posterior',
    N5: 'lateral', N6: 'lateral', N7: 'anterior',
    N8: 'lateral', N9: 'posterior', N10: 'lateral',
    N11: 'anterior', N12: 'posterior'
  };

  // Collect tension data from RoutineHistory feedback
  const nodeMap = {};
  for (const session of routineHistory) {
    const fb = session.feedback;
    if (!fb || !fb.node_id) continue;
    const nodeId = fb.node_id;
    if (!nodeMap[nodeId]) nodeMap[nodeId] = { count: 0, maxTension: 0, permissionFailures: 0 };
    nodeMap[nodeId].count++;
    nodeMap[nodeId].maxTension = Math.max(nodeMap[nodeId].maxTension, fb.tension_level || 0);
    if (fb.neural_permission === false) nodeMap[nodeId].permissionFailures++;
  }

  if (Object.keys(nodeMap).length === 0) return [];

  const nodes = [];
  for (const [nodeId, sling] of Object.entries(NODE_SLING_MAP)) {
    const data = nodeMap[nodeId];
    let status = 'green';
    if (data) {
      if (data.maxTension >= 7) status = 'red';
      else if (data.maxTension >= 5) status = 'orange';
      else if (data.maxTension >= 4 || data.permissionFailures > 0) status = 'yellow';
    }
    nodes.push({ node_id: nodeId, sling, status });
  }

  return nodes;
}

function buildAlerts(routineHistory, latestCheck) {
  const alerts = [];

  if (latestCheck?.readiness_status === 'red') {
    alerts.push({
      type: 'low_readiness',
      severity: 'critical',
      message: 'Dein System ist im Recovery-Modus. Leichte Mobilität oder Ruhe empfohlen.',
    });
  } else if (latestCheck?.readiness_status === 'yellow') {
    alerts.push({
      type: 'moderate_readiness',
      severity: 'warning',
      message: 'Dein System ist eingeschränkt. Intensität heute reduzieren.',
    });
  }

  // Alert if most recent session had neural permission failure
  const latestSession = routineHistory[0];
  if (latestSession?.feedback?.neural_permission === false) {
    const reason = latestSession.feedback.neural_permission_reason || 'unknown';
    alerts.push({
      type: 'neural_guarding',
      severity: 'warning',
      message: `Letzte Session: Neural Guarding erkannt (${reason}). Bei der nächsten Session Intensität reduzieren.`,
    });
  }

  return alerts;
}