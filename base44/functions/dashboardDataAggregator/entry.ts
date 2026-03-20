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
    const [readinessChecks, rehabPlans, trainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-check_date', daysBack),
      base44.entities.RehabPlan.filter({ user_email: user.email }, '-updated_date', 5),
      base44.entities.TrainingPlan.filter({ user_email: user.email }, '-updated_date', 5),
    ]);

    const hasNoData = readinessChecks.length === 0 && rehabPlans.length === 0 && trainingPlans.length === 0;

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
    // Readiness score is 1-10, we normalize to 0-100
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

    // Latest readiness check for current stats
    const latestCheck = readinessChecks[0] || null;

    // --- MCS Score: weighted average of the latest readiness check ---
    let mcs = 0;
    if (latestCheck) {
      // Weighted: hardware 40%, focus 30%, energy 30%
      const weighted =
        (latestCheck.feeling_hardware * 0.4) +
        (latestCheck.focus_software * 0.3) +
        (latestCheck.energy_battery * 0.3);
      mcs = Math.round((weighted / 10) * 100);
    }

    // --- Heatmap nodes: derived from rehab plan live_adjust_log ---
    const heatmapNodes = buildHeatmapFromPlans(rehabPlans, latestCheck);

    // --- Alerts from training plan & rehab feedback ---
    const alerts = buildAlerts(rehabPlans, trainingPlans, latestCheck);

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

function buildHeatmapFromPlans(rehabPlans, latestCheck) {
  const nodes = [];
  const NODE_SLING_MAP = {
    N1: 'lateral', N2: 'anterior', N3: 'posterior',
    N5: 'lateral', N6: 'lateral', N7: 'anterior',
    N8: 'lateral', N9: 'posterior', N10: 'lateral',
    N11: 'anterior', N12: 'posterior'
  };

  // Collect pain nodes from rehab plan live_adjust_log
  const painNodeMap = {};
  for (const plan of rehabPlans) {
    if (plan.live_adjust_log && Array.isArray(plan.live_adjust_log)) {
      for (const entry of plan.live_adjust_log) {
        if (entry.node_feedback) {
          const nodeId = entry.node_feedback;
          if (!painNodeMap[nodeId]) painNodeMap[nodeId] = { count: 0, maxPain: 0 };
          painNodeMap[nodeId].count++;
          painNodeMap[nodeId].maxPain = Math.max(painNodeMap[nodeId].maxPain, entry.pain_nrs || 0);
        }
      }
    }
    // Also check pain_feedback_node field
    if (plan.pain_feedback_node) {
      const nodeId = plan.pain_feedback_node;
      if (!painNodeMap[nodeId]) painNodeMap[nodeId] = { count: 0, maxPain: 0 };
      painNodeMap[nodeId].count++;
      painNodeMap[nodeId].maxPain = Math.max(painNodeMap[nodeId].maxPain, plan.pain_nrs || 0);
    }
  }

  // If no rehab data, return empty (no heatmap)
  if (Object.keys(painNodeMap).length === 0) {
    return [];
  }

  // Build node list with status
  for (const [nodeId, sling] of Object.entries(NODE_SLING_MAP)) {
    const painData = painNodeMap[nodeId];
    let status = 'green';
    if (painData) {
      if (painData.maxPain >= 7) status = 'red';
      else if (painData.maxPain >= 5) status = 'orange';
      else if (painData.maxPain >= 3) status = 'yellow';
    }
    nodes.push({ node_id: nodeId, sling, status });
  }

  return nodes;
}

function buildAlerts(rehabPlans, trainingPlans, latestCheck) {
  const alerts = [];

  // Alert if readiness is red
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

  // Alert if active rehab plan has recent pain intervention
  for (const plan of rehabPlans) {
    if (plan.intervention_mode && plan.intervention_mode !== 'none') {
      alerts.push({
        type: 'rehab_intervention',
        severity: plan.intervention_mode === 'red_stop' ? 'critical' : 'warning',
        message: `Aktiver Rehab-Plan meldet Schmerz-Intervention (${plan.pain_feedback_node || 'unbekannt'}). Bitte Übungen anpassen.`,
      });
      break;
    }
  }

  return alerts;
}