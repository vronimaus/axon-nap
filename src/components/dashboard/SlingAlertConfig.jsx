/**
 * AXON Sling-Alert Configuration & Trigger Logic
 * This file defines the thresholds and logic for imbalance alerts
 * that trigger coaching interventions and session modifications
 */

export const SLING_ALERT_CONFIG = {
  // Critical imbalance: Delta between highest and lowest sling > 4.0
  CRITICAL_IMBALANCE: {
    delta_threshold: 4.0,
    severity: 'critical',
    message_template: 'Kritisches Ungleichgewicht erkannt. Dein {{low_sling}}-System ist stark unterentwickelt. Das könnte zu Kompensationsmustern führen. Ich habe deine nächste Session angepasst.',
    recommendation: 'force_focused_session'
  },

  // Moderate imbalance: Delta between 2.5 and 4.0
  MODERATE_IMBALANCE: {
    delta_threshold: 2.5,
    severity: 'warning',
    message_template: 'Leichtes Ungleichgewicht: {{low_sling}} hinkt hinterher. Nicht kritisch, aber wir sollten das balancieren.',
    recommendation: 'suggest_focused_session'
  },

  // Low performer: Any single sling < 4.0
  LOW_PERFORMER: {
    score_threshold: 4.0,
    severity: 'info',
    message_template: 'Deine {{sling}}-Kette braucht Training. Das ist normal – wir bauen sie auf.',
    recommendation: 'provide_exercises'
  },

  // Pain reduction achievement
  PAIN_FREE: {
    avg_nrs_threshold: 2.0,
    severity: 'positive',
    message_template: 'Großartig! Deine Übungen waren fast schmerzfrei. Das bedeutet, dein System integriert gut.',
    recommendation: 'motivate'
  }
};

/**
 * Sling-specific context: Exercises, drills, and nodes to focus on
 */
export const SLING_FOCUS_CONTEXT = {
  anterior: {
    exercises: [
      { id: 'BW_COR_001', name: 'Dead Bug', progression: 2 },
      { id: 'PAL_ANTI_001', name: 'Pallof Press', progression: 4 },
      { id: 'AB_ANTI_002', name: 'Anti-Rotation Hold', progression: 3 }
    ],
    neuro_drill: 'Kreisaugenbewegungen (Oculomotor Tracking)',
    node_focus: ['N2', 'N7', 'N11'],
    description: 'Anterior Chain – Front Core & Breathing Coordination'
  },

  posterior: {
    exercises: [
      { id: 'BW_COR_002', name: 'Bird-Dog', progression: 2 },
      { id: 'KB_HIN_005', name: 'Single-Leg RDL', progression: 6 },
      { id: 'KB_HIN_003', name: 'Good Mornings', progression: 4 }
    ],
    neuro_drill: 'Gaze Stabilization – Posterior Hip Hinge Pattern',
    node_focus: ['N3', 'N9', 'N12'],
    description: 'Posterior Chain – Hamstrings, Glutes & Spinal Extension'
  },

  lateral: {
    exercises: [
      { id: 'BW_LAT_001', name: 'Side Plank Bridge', progression: 3 },
      { id: 'KB_GEN_005', name: 'Turkish Get-Up', progression: 8 },
      { id: 'MOB_LAT_001', name: 'Monster Walks', progression: 2 }
    ],
    neuro_drill: 'Vestibular Saccades – Balance & Proprioception',
    node_focus: ['N1', 'N5', 'N6', 'N8', 'N10'],
    description: 'Lateral Chain – Side Stabilizers & Shoulder Control'
  }
};

/**
 * Evaluate sling balance and return appropriate alert
 */
export function evaluateImbalance(anterior, posterior, lateral) {
  const scores = [anterior, posterior, lateral];
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const delta = max - min;

  const slingNames = ['anterior', 'posterior', 'lateral'];
  const lowSlingIndex = scores.indexOf(min);
  const lowSling = slingNames[lowSlingIndex];

  if (delta > SLING_ALERT_CONFIG.CRITICAL_IMBALANCE.delta_threshold) {
    return {
      type: 'critical_imbalance',
      severity: 'critical',
      delta: parseFloat(delta.toFixed(2)),
      low_sling: lowSling,
      low_score: min,
      context: SLING_FOCUS_CONTEXT[lowSling]
    };
  }

  if (delta >= SLING_ALERT_CONFIG.MODERATE_IMBALANCE.delta_threshold) {
    return {
      type: 'moderate_imbalance',
      severity: 'warning',
      delta: parseFloat(delta.toFixed(2)),
      low_sling: lowSling,
      low_score: min,
      context: SLING_FOCUS_CONTEXT[lowSling]
    };
  }

  return null;
}

/**
 * Evaluate individual sling performance
 */
export function evaluateLowPerformer(anterior, posterior, lateral) {
  const threshold = SLING_ALERT_CONFIG.LOW_PERFORMER.score_threshold;
  const alerts = [];

  if (anterior < threshold) {
    alerts.push({
      type: 'low_performer',
      severity: 'info',
      sling: 'anterior',
      score: anterior,
      context: SLING_FOCUS_CONTEXT.anterior
    });
  }

  if (posterior < threshold) {
    alerts.push({
      type: 'low_performer',
      severity: 'info',
      sling: 'posterior',
      score: posterior,
      context: SLING_FOCUS_CONTEXT.posterior
    });
  }

  if (lateral < threshold) {
    alerts.push({
      type: 'low_performer',
      severity: 'info',
      sling: 'lateral',
      score: lateral,
      context: SLING_FOCUS_CONTEXT.lateral
    });
  }

  return alerts.length > 0 ? alerts : null;
}

/**
 * Evaluate pain-free training
 */
export function evaluatePainReduction(exercises) {
  if (!exercises || exercises.length === 0) return null;

  const avgNRS = exercises.reduce((sum, ex) => sum + (ex.pain_nrs || 0), 0) / exercises.length;

  if (avgNRS < SLING_ALERT_CONFIG.PAIN_FREE.avg_nrs_threshold) {
    return {
      type: 'pain_free_training',
      severity: 'positive',
      avg_nrs: parseFloat(avgNRS.toFixed(1)),
      message: 'Schmerzfreies Training erkannt – Neuraler Integration erfolgreich!'
    };
  }

  return null;
}

/**
 * Build coaching context JSON for performance_coach agent
 * This is what the agent will use to generate coaching instructions
 */
export function buildCoachingContext(anteriorScore, posteriorScore, lateralScore, exercises) {
  const imbalanceAlert = evaluateImbalance(anteriorScore, posteriorScore, lateralScore);
  const lowPerformerAlerts = evaluateLowPerformer(anteriorScore, posteriorScore, lateralScore);
  const painAlert = evaluatePainReduction(exercises);

  return {
    sling_scores: {
      anterior: anteriorScore,
      posterior: posteriorScore,
      lateral: lateralScore
    },
    alerts: {
      imbalance: imbalanceAlert,
      low_performers: lowPerformerAlerts,
      pain_reduction: painAlert
    },
    primary_focus: imbalanceAlert?.low_sling || lowPerformerAlerts?.[0]?.sling || null,
    context: imbalanceAlert?.context || lowPerformerAlerts?.[0]?.context || null,
    recommended_exercises: imbalanceAlert?.context?.exercises || lowPerformerAlerts?.[0]?.context?.exercises || [],
    neuro_drill: imbalanceAlert?.context?.neuro_drill || lowPerformerAlerts?.[0]?.context?.neuro_drill || null
  };
}