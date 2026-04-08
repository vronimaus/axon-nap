/**
 * Neural Permission Evaluation System
 * Detects "Neurological Guarding" based on FMS and Gary Gray 3DMAPS principles
 * Returns routing instructions for appropriate interventions
 */

export function evaluateNeuralPermission(results) {
  const { pain_level, rom_improvement, movement_quality } = results;

  // FMS-Regel: Jeglicher Schmerz = sofortiger Abbruch (Score 0)
  const hasPain = pain_level > 0;

  // ROM muss sich verbessern (Score >= 2 ist akzeptabel: "Etwas weiter" oder besser)
  const noRomImprovement = rom_improvement <= 1;

  // FMS-Regel: Qualität Score 3 = voll funktional, Score 2 oder weniger = Kompensation/Instabilität
  const isUnstable = movement_quality < 3;

  if (hasPain || noRomImprovement || isUnstable) {
    let reason = 'CLEAR';
    if (hasPain) reason = 'PAIN';
    else if (noRomImprovement) reason = 'NO_ROM';
    else if (isUnstable) reason = 'INSTABILITY';

    return {
      permissionGranted: false,
      reason,
      score: { pain_level, rom_improvement, movement_quality },
      recommendedAction: getRecommendedAction(reason),
      message: getBlockMessage(reason)
    };
  }

  return {
    permissionGranted: true,
    reason: 'CLEAR',
    score: { pain_level, rom_improvement, movement_quality },
    recommendedAction: 'PROCEED_TO_INTEGRATION',
    message: '✅ Neural Permission erteilt! Dein Nervensystem hat die Bewegung freigegeben.'
  };
}

export function getRecommendedAction(reason) {
  switch (reason) {
    case 'PAIN':
    case 'NO_ROM':
      // Strong guarding signal: parasympathetic emergency exit
      return 'PARASYMPATHETIC_EXIT';
    case 'INSTABILITY':
      // Proprioceptive map too blurry: sensory priming
      return 'SENSORY_PRIMING';
    default:
      return 'PROCEED_TO_INTEGRATION';
  }
}

export function getBlockMessage(reason) {
  const messages = {
    PAIN: '⚠️ Schmerz erkannt! Dein Nervensystem sagt STOP. Wir aktivieren einen Beruhigungs-Drill (Vagus), um die Schutzspannung zu senken.',
    NO_ROM: '⚠️ Keine ROM-Verbesserung. Dein Gehirn braucht weniger mechanische Herausforderung. Wir reduzieren die Position und versuchen es erneut.',
    INSTABILITY: '⚠️ Instabilität erkannt. Deine propriozeptive Landkarte ist zu unscharf. Wir aktivieren Tapping-Priming, um deine Wahrnehmung zu schärfen.'
  };
  return messages[reason] || 'Neurological Guarding erkannt. System adaptiert.';
}

export function buildInterventionFlow(evaluation, tuneUpData) {
  if (evaluation.permissionGranted) {
    return {
      nextScreen: 'INTEGRATION',
      instruction: 'Fahre mit der Integrations-Bewegung fort',
      duration: null
    };
  }

  const { reason } = evaluation;

  if (reason === 'PAIN') {
    return {
      nextScreen: 'PARASYMPATHETIC_DRILL',
      instruction: tuneUpData?.parasympathetic_vagus_drill || 'Tiefe Zwerchfellatmung: 5 Zyklen à 5 Sekunden Einatmen, 5 Sekunden Ausatmen',
      duration: 60, // 60 seconds
      message: 'Lass dein Nervensystem sich beruhigen. Danach versuchen wir es erneut.'
    };
  }

  if (reason === 'NO_ROM') {
    return {
      nextScreen: 'TWEAKOLOGY_POSITION_REGRESSION',
      instruction: tuneUpData?.tweak_position_regression || 'Position angepasst (weniger Schwerkraft-Belastung)',
      duration: null,
      message: 'Dein Körper braucht weniger Herausforderung. Wir probieren eine einfachere Position.',
      tweakApplied: true
    };
  }

  if (reason === 'INSTABILITY') {
    return {
      nextScreen: 'SENSORY_PRIMING',
      instruction: tuneUpData?.sensory_priming_action || 'Klopfe die Zielregion 15 Sekunden lang rhythmisch ab',
      duration: 15,
      message: 'Wir schärfen deine Körperwahrnehmung mit Tapping, damit dein Gehirn die Bewegung besser steuern kann.',
      primingAction: true
    };
  }

  return {
    nextScreen: 'INTEGRATION',
    instruction: 'Fahre mit der Integrations-Bewegung fort',
    duration: null
  };
}