import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch data in parallel
    const [readinessChecks, rehabPlans, trainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }),
      base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' }),
      base44.entities.TrainingPlan.filter({ user_email: user.email, status: 'active' }),
    ]);

    // Get today's readiness check (most recent)
    const todayReadiness = readinessChecks
      .filter(r => r.check_date === today)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;

    const activeRehab = rehabPlans[0] || null;
    const activeTraining = trainingPlans[0] || null;

    // === TRIAGE LOGIC ===

    // 1. REST CHECK — lowest energy or hardware score
    if (todayReadiness) {
      const { energy_battery, feeling_hardware } = todayReadiness;
      if (energy_battery < 3 || feeling_hardware < 3) {
        return Response.json({
          decision: 'rest',
          color: 'slate',
          title: 'System-Reset & Erholung',
          reason: `Dein ${energy_battery < 3 ? 'Energie-Level' : 'Hardware-Status'} (${energy_battery < 3 ? energy_battery : feeling_hardware}/10) signalisiert, dass dein Körper heute Regeneration braucht.`,
          recommendation: 'Fokus auf Atemarbeit, leichte Mobilisation und Schlaf-Qualität.',
          cta: { label: 'Flow Routinen', page: 'FlowRoutines' },
          has_rehab: !!activeRehab,
          has_training: !!activeTraining,
        });
      }
    }

    // 2. REHAB OVERRIDE — active pain signal
    if (activeRehab) {
      const painNrs = activeRehab.pain_nrs || 0;
      const interventionMode = activeRehab.intervention_mode || 'none';
      const painNode = activeRehab.pain_feedback_node;

      if (painNrs > 3 || interventionMode === 'red_stop') {
        const nodeText = painNode ? ` bei Node ${painNode}` : '';
        return Response.json({
          decision: 'rehab_override',
          color: 'blue',
          title: 'Stabilität & Struktur-Schutz',
          reason: `Dein Schmerz-Signal${nodeText} (NRS ${painNrs}/10) zeigt: Dein Körper braucht heute strukturelle Unterstützung statt Leistung.`,
          recommendation: 'Dein Rehab-Plan steht bereit. Jede Übung heute ist eine Investition in deine Maximalkraft von morgen.',
          cta: { label: 'Zum Reha-Plan', page: 'RehabPlan' },
          has_rehab: true,
          has_training: !!activeTraining,
        });
      }

      // Yellow zone — rehab recommended but training possible
      if (painNrs > 0 && painNrs <= 3) {
        const nodeText = painNode ? ` (Node ${painNode})` : '';
        return Response.json({
          decision: 'rehab_first',
          color: 'amber',
          title: 'Rehab zuerst, dann Training',
          reason: `Leichtes Schmerzsignal${nodeText} aktiv (NRS ${painNrs}/10). Starte mit deinem Rehab-Plan, bevor du trainierst.`,
          recommendation: 'Nach dem Rehab-Check: grünes Licht für modifiziertes Training.',
          cta: { label: 'Zum Reha-Plan', page: 'RehabPlan' },
          secondary_cta: { label: 'Trotzdem trainieren', page: 'TrainingPlan' },
          has_rehab: true,
          has_training: !!activeTraining,
        });
      }
    }

    // 3. TRAINING — all clear
    if (activeTraining) {
      return Response.json({
        decision: 'training',
        color: 'amber',
        title: 'Maximalkraft & Performance',
        reason: todayReadiness
          ? `Readiness Check: ${todayReadiness.feeling_hardware}/10 Hardware · ${todayReadiness.focus_software}/10 Software · ${todayReadiness.energy_battery}/10 Energie. System bereit.`
          : 'Kein Schmerzsignal aktiv. System bereit für Progression.',
        recommendation: 'Dein Trainingsplan steht bereit. Zeit für Fortschritt.',
        cta: { label: 'Zum Trainingsplan', page: 'TrainingPlan' },
        has_rehab: !!activeRehab,
        has_training: true,
      });
    }

    // 4. NO ACTIVE PLAN — onboarding
    return Response.json({
      decision: 'no_plan',
      color: 'cyan',
      title: 'Bereit loszulegen?',
      reason: 'Du hast noch keinen aktiven Plan. Wähle deinen Einstieg.',
      recommendation: 'Starte mit einer Diagnose (Reha) oder definiere dein Performance-Ziel.',
      cta: { label: 'Diagnose starten', page: 'DiagnosisChat' },
      secondary_cta: { label: 'Performance-Ziel setzen', page: 'PerformanceTestChoice' },
      has_rehab: false,
      has_training: false,
    });

  } catch (error) {
    console.error('sessionGenerator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});