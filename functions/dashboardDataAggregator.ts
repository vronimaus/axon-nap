import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Alert trigger thresholds
const ALERT_THRESHOLDS = {
  CRITICAL_IMBALANCE_DELTA: 4.0,
  MODERATE_IMBALANCE_DELTA: 2.5,
  LOW_PERFORMER_SCORE: 4.0,
  PAIN_FREE_NRS: 2.0
};

function generateNodeHeatmap(todayStats) {
  const anterior = todayStats.anterior_score;
  const posterior = todayStats.posterior_score;
  const lateral = todayStats.lateral_score;

  const scoreToStatus = (score) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    if (score >= 4) return 'orange';
    return 'red';
  };

  return [
    { node_id: 'N1', sling: 'lateral', status: scoreToStatus(lateral), score: lateral },
    { node_id: 'N2', sling: 'anterior', status: scoreToStatus(anterior), score: anterior },
    { node_id: 'N3', sling: 'posterior', status: scoreToStatus(posterior), score: posterior },
    { node_id: 'N5', sling: 'lateral', status: scoreToStatus(lateral), score: lateral },
    { node_id: 'N6', sling: 'lateral', status: scoreToStatus(lateral), score: lateral },
    { node_id: 'N7', sling: 'anterior', status: scoreToStatus(anterior), score: anterior },
    { node_id: 'N8', sling: 'lateral', status: scoreToStatus(lateral), score: lateral },
    { node_id: 'N9', sling: 'posterior', status: scoreToStatus(posterior), score: posterior },
    { node_id: 'N10', sling: 'lateral', status: scoreToStatus(lateral), score: lateral },
    { node_id: 'N11', sling: 'anterior', status: scoreToStatus(anterior), score: anterior },
    { node_id: 'N12', sling: 'posterior', status: scoreToStatus(posterior), score: posterior }
  ];
}

function identifyImbalances(todayStats, avg7d) {
  const alerts = [];
  const anterior = todayStats.anterior_score;
  const posterior = todayStats.posterior_score;
  const lateral = todayStats.lateral_score;

  const scores = [anterior, posterior, lateral];
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const imbalance = maxScore - minScore;

  const slingNames = ['anterior', 'posterior', 'lateral'];

  if (imbalance > ALERT_THRESHOLDS.CRITICAL_IMBALANCE_DELTA) {
    const lowSling = slingNames[scores.indexOf(minScore)];
    alerts.push({
      type: 'critical_imbalance',
      sling: lowSling,
      severity: 'critical',
      delta: parseFloat(imbalance.toFixed(2)),
      score: parseFloat(minScore.toFixed(2)),
      message: `Kritisches Ungleichgewicht: ${lowSling} ist bei ${minScore.toFixed(1)}/10. Das Kompensationsmuster könnte zu Überlastung führen.`,
      recommendation: 'force_focused_session',
      coaching_instruction: `Konzentriere dich heute auf Deine ${lowSling} Sling. Das ist die Basis für stabiles Training.`
    });
  } else if (imbalance >= ALERT_THRESHOLDS.MODERATE_IMBALANCE_DELTA) {
    const lowSling = slingNames[scores.indexOf(minScore)];
    alerts.push({
      type: 'moderate_imbalance',
      sling: lowSling,
      severity: 'warning',
      delta: parseFloat(imbalance.toFixed(2)),
      score: parseFloat(minScore.toFixed(2)),
      message: `Ungleichgewicht erkannt: ${lowSling} hinkt hinterher (${minScore.toFixed(1)}/10). Nicht kritisch, aber wir sollten balancieren.`,
      recommendation: 'suggest_focused_session',
      coaching_instruction: `Optional: Erwäge Übungen für deine ${lowSling} Sling in den nächsten Sessions.`
    });
  }

  if (anterior < ALERT_THRESHOLDS.LOW_PERFORMER_SCORE) {
    alerts.push({
      type: 'low_performer',
      sling: 'anterior',
      severity: 'info',
      score: parseFloat(anterior.toFixed(2)),
      message: `Anterior Sling trainiert (${anterior.toFixed(1)}/10). Dead Bugs, Pallof Presses bauen hier auf.`,
      recommendation: 'provide_exercises',
      focus_nodes: ['N2', 'N7', 'N11']
    });
  }
  if (posterior < ALERT_THRESHOLDS.LOW_PERFORMER_SCORE) {
    alerts.push({
      type: 'low_performer',
      sling: 'posterior',
      severity: 'info',
      score: parseFloat(posterior.toFixed(2)),
      message: `Posterior Sling trainiert (${posterior.toFixed(1)}/10). Bird Dogs, RDLs bauen hier auf.`,
      recommendation: 'provide_exercises',
      focus_nodes: ['N3', 'N9', 'N12']
    });
  }
  if (lateral < ALERT_THRESHOLDS.LOW_PERFORMER_SCORE) {
    alerts.push({
      type: 'low_performer',
      sling: 'lateral',
      severity: 'info',
      score: parseFloat(lateral.toFixed(2)),
      message: `Lateral Sling trainiert (${lateral.toFixed(1)}/10). Side Planks, Single-Leg RDLs bauen hier auf.`,
      recommendation: 'provide_exercises',
      focus_nodes: ['N1', 'N5', 'N6', 'N8', 'N10']
    });
  }

  return alerts;
}

function calculateHealthScore(todayStats) {
  const anterior = todayStats.anterior_score;
  const posterior = todayStats.posterior_score;
  const lateral = todayStats.lateral_score;
  const avg = (anterior + posterior + lateral) / 3;
  const imbalance = Math.max(anterior, posterior, lateral) - Math.min(anterior, posterior, lateral);
  const baseScore = avg * 10;
  const imbalancePenalty = Math.min(20, imbalance * 5);
  const healthScore = Math.max(0, baseScore - imbalancePenalty);
  return Math.round(healthScore);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      console.log('No JSON body provided');
    }
    const { daysBack = 30 } = body;

    // Fetch all SlingProgress records for the user in the past N days
    const allSlingProgress = await base44.entities.SlingProgress.filter(
      { user_email: user.email },
      '-date',
      daysBack
    );

    if (!allSlingProgress || allSlingProgress.length === 0) {
      return Response.json({
        success: true,
        message: 'No sling progress data yet',
        data: {
          user_email: user.email,
          period_days: daysBack,
          latest_stats: null,
          historical_data: [],
          heatmap_nodes: [],
          sling_imbalance_alerts: []
        }
      });
    }

    // Get today's (most recent) stats
    const todayStats = allSlingProgress[0];

    // Prepare time-series data for charts
    const historicalData = allSlingProgress.map(record => ({
      date: record.date,
      anterior: record.anterior_score,
      posterior: record.posterior_score,
      lateral: record.lateral_score,
      overall_readiness: record.overall_readiness
    }));

    // Calculate 7-day and 30-day averages
    const last7Days = allSlingProgress.slice(0, 7);
    const last30Days = allSlingProgress.slice(0, 30);

    const avg7d = {
      anterior: (last7Days.reduce((sum, r) => sum + r.anterior_score, 0) / last7Days.length).toFixed(2),
      posterior: (last7Days.reduce((sum, r) => sum + r.posterior_score, 0) / last7Days.length).toFixed(2),
      lateral: (last7Days.reduce((sum, r) => sum + r.lateral_score, 0) / last7Days.length).toFixed(2)
    };

    const avg30d = {
      anterior: (last30Days.reduce((sum, r) => sum + r.anterior_score, 0) / last30Days.length).toFixed(2),
      posterior: (last30Days.reduce((sum, r) => sum + r.posterior_score, 0) / last30Days.length).toFixed(2),
      lateral: (last30Days.reduce((sum, r) => sum + r.lateral_score, 0) / last30Days.length).toFixed(2)
    };

    // Generate heatmap data for nodes (based on sling scores)
    const heatmapNodes = generateNodeHeatmap(todayStats);

    // Identify imbalance alerts
    const imbalanceAlerts = identifyImbalances(todayStats, avg7d);

    // Fetch top contributing exercises from today
    const topContributors = (todayStats.contributing_exercises || [])
      .sort((a, b) => b.contribution_score - a.contribution_score)
      .slice(0, 3);

    // Pain impact reduction calculation
    const painAvg = todayStats.contributing_exercises
      ? (todayStats.contributing_exercises.reduce((sum, ex) => sum + ex.pain_nrs, 0) / 
         todayStats.contributing_exercises.length)
      : 0;

    return Response.json({
      success: true,
      data: {
        user_email: user.email,
        generated_date: new Date().toISOString(),
        period_days: daysBack,

        // Latest status
        latest_stats: {
          date: todayStats.date,
          timestamp: todayStats.timestamp,
          anterior: parseFloat(todayStats.anterior_score),
          posterior: parseFloat(todayStats.posterior_score),
          lateral: parseFloat(todayStats.lateral_score),
          overall_readiness: todayStats.overall_readiness,
          session_count: todayStats.session_count
        },

        // Trend comparisons
        trends: {
          anterior_change_7d: (todayStats.anterior_score - avg7d.anterior).toFixed(2),
          posterior_change_7d: (todayStats.posterior_score - avg7d.posterior).toFixed(2),
          lateral_change_7d: (todayStats.lateral_score - avg7d.lateral).toFixed(2),
          anterior_change_30d: (todayStats.anterior_score - avg30d.anterior).toFixed(2),
          posterior_change_30d: (todayStats.posterior_score - avg30d.posterior).toFixed(2),
          lateral_change_30d: (todayStats.lateral_score - avg30d.lateral).toFixed(2)
        },

        // Averages
        averages: {
          last_7_days: avg7d,
          last_30_days: avg30d
        },

        // Time series for charts
        historical_data: historicalData.reverse(), // Reverse to chronological order

        // Node heatmap (12 nodes with color coding)
        heatmap_nodes: heatmapNodes,

        // Imbalance warnings (now with detailed coaching context)
        sling_alerts: imbalanceAlerts,
        primary_coaching_focus: imbalanceAlerts.find(a => a.type === 'critical_imbalance' || a.type === 'moderate_imbalance')?.sling || null,

        // Top exercises that contributed
        top_contributing_exercises: topContributors.map(ex => ({
          exercise_name: ex.exercise_name,
          sling_type: ex.sling_type,
          contribution: ex.contribution_score.toFixed(2),
          quality_factor: ex.quality_factor.toFixed(2),
          pain_nrs: ex.pain_nrs
        })),

        // Overall health score (0-100)
        overall_health_score: calculateHealthScore(todayStats),

        // Pain management metric
        pain_impact_reduction: ((1 - painAvg / 10) * 100).toFixed(0) + '%'
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