import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch minimal data needed
    // RoutineHistory uses created_by RLS — no user_email filter needed
    const [readinessChecks, routineHistory, activeTrainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-check_date', 7),
      base44.entities.RoutineHistory.filter({}, '-created_date', 5),
      base44.entities.TrainingPlan.filter({ user_email: user.email, status: 'active' }, '-updated_date', 1),
    ]);

    const activeTraining = activeTrainingPlans[0] || null;
    const latestSession = routineHistory[0] || null;

    // === MCS: 3 components ===

    // A. Today's readiness (30%)
    const today = new Date().toISOString().split('T')[0];
    const todayReadiness = readinessChecks.find(r => r.check_date === today) || null;
    let readinessScore = 0.5;
    if (todayReadiness?.readiness_status === 'green') readinessScore = 1.0;
    else if (todayReadiness?.readiness_status === 'red') readinessScore = 0.0;

    // B. Session integrity (40%) — from latest RoutineHistory neural permission
    let slingScore = 1.0;
    if (latestSession?.feedback?.neural_permission === false) {
      const reason = latestSession.feedback.neural_permission_reason;
      if (reason === 'TENSION') slingScore = 0.0;
      else slingScore = 0.5;
    } else if (todayReadiness?.readiness_status === 'red') {
      slingScore = 0.3;
    }

    // C. History consistency (30%)
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
        cta: { label: 'Mobilität & Flow', page: 'FlowRoutines' },
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
      latestSession && activeTraining && slingScore > 0.5
        ? 'Deine Mobilitäts-Arbeit zahlt sich aus: Deine Bewegungsqualität verbessert sich!'
        : null;

    return Response.json({
      ...decision,
      benchmarkTransferMessage,
      has_recent_sessions: routineHistory.length > 0,
      has_training: !!activeTraining,
    });

  } catch (error) {
    console.error('sessionGenerator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});