import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch minimal data needed — small limits to stay within CPU budget
    const [readinessChecks, activeRehabPlans, activeTrainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-check_date', 7),
      base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' }, '-updated_date', 1),
      base44.entities.TrainingPlan.filter({ user_email: user.email, status: 'active' }, '-updated_date', 1),
    ]);

    const activeRehab = activeRehabPlans[0] || null;
    const activeTraining = activeTrainingPlans[0] || null;

    // === MCS: 3 components ===

    // A. Today's readiness (30%)
    const todayReadiness = readinessChecks.find(r => r.check_date === today) || null;
    let readinessScore = 0.5;
    if (todayReadiness?.readiness_status === 'green') readinessScore = 1.0;
    else if (todayReadiness?.readiness_status === 'red') readinessScore = 0.0;

    // B. Sling/Rehab integrity (40%) — from rehab plan state
    let slingScore = 1.0;
    if (activeRehab?.intervention_mode === 'red_stop') slingScore = 0.0;
    else if (activeRehab?.intervention_mode === 'yellow_pivot') slingScore = 0.5;
    else if (todayReadiness?.readiness_status === 'red') slingScore = 0.3;

    // C. History consistency (30%) — avg of last 7 readiness checks
    let historyScore = 0.5;
    if (readinessChecks.length > 0) {
      const avg = readinessChecks.reduce((sum, r) => {
        if (r.readiness_status === 'green') return sum + 1.0;
        if (r.readiness_status === 'yellow') return sum + 0.5;
        return sum;
      }, 0) / readinessChecks.length;
      historyScore = Math.min(avg + Math.min(readinessChecks.length / 7, 1.0) * 0.1, 1.0);
    }

    const mcs = Math.round(((slingScore * 0.4) + (readinessScore * 0.3) + (historyScore * 0.3)) * 100);

    // === Session Decision ===
    let decision;
    if (mcs >= 80) {
      decision = {
        decision: 'training',
        status: 'Peak Performance',
        mcs,
        color: 'cyan',
        title: 'Peak Performance',
        reason: 'System ist hochgefahren. Optimale Bedingungen für Progression und neue Reize.',
        psychological_framing: 'Du bist in Topform. Nutze die Energie für deine anspruchsvollsten Ziele.',
        recommendation: 'Du bist in Topform. Nutze die Energie für deine anspruchsvollsten Ziele.',
        cta: { label: 'Performance Training', page: 'TrainingPlan' },
      };
    } else if (mcs >= 40) {
      decision = {
        decision: 'rehab_first',
        status: 'Sanfter Flow',
        mcs,
        color: 'emerald',
        title: 'Sanfter Flow',
        reason: 'Leichte Asymmetrien oder Ermüdung erkannt. Fokus auf Qualität statt Quantität.',
        psychological_framing: 'Perfekter Tag, um deine Basis zu stärken. Wir arbeiten heute an deinen Schwachstellen.',
        recommendation: 'Perfekter Tag, um deine Basis zu stärken. Wir arbeiten heute an deinen Schwachstellen.',
        cta: { label: 'Rehab & Flow', page: 'RehabPlan' },
      };
    } else {
      decision = {
        decision: 'rest',
        status: 'Recovery',
        mcs,
        color: 'slate',
        title: 'System-Reset & Erholung',
        reason: 'System beansprucht. Fokus auf Regeneration und Parasympathikus-Aktivierung.',
        psychological_framing: 'Dein System konsolidiert gerade die letzten Reize. Gib deinen Neuronen Zeit, die neuen Pfade zu festigen.',
        recommendation: 'Dein System konsolidiert gerade die letzten Reize. Gib deinen Neuronen Zeit, die neuen Pfade zu festigen.',
        cta: { label: 'Recovery Flow', page: 'FlowRoutines' },
      };
    }

    const benchmarkTransferMessage =
      activeRehab && activeTraining && slingScore > 0.5
        ? 'Deine Rehab-Arbeit zahlt sich aus: Deine Asymmetrien werden geringer!'
        : null;

    return Response.json({
      ...decision,
      benchmarkTransferMessage,
      has_rehab: !!activeRehab,
      has_training: !!activeTraining,
    });

  } catch (error) {
    console.error('sessionGenerator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});