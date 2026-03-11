import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Fetch data in parallel — NO nested function calls to avoid CPU timeout
    const [readinessChecks, rehabPlans, trainingPlans] = await Promise.all([
      base44.entities.ReadinessCheck.filter({ user_email: user.email }, '-check_date', 10),
      base44.entities.RehabPlan.filter({ user_email: user.email, status: 'active' }, '-updated_date', 3),
      base44.entities.TrainingPlan.filter({ user_email: user.email, status: 'active' }, '-updated_date', 3),
    ]);

    const activeRehab = rehabPlans[0] || null;
    const activeTraining = trainingPlans[0] || null;

    // === 1. Calculate MCS (Master Consistency Score) Components ===

    // A. Readiness Score (30%)
    const todayReadiness = readinessChecks
      .filter(r => r.check_date === today)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;

    let readinessScore = 0.5; // Default yellow
    if (todayReadiness) {
        if (todayReadiness.readiness_status === 'green') readinessScore = 1.0;
        else if (todayReadiness.readiness_status === 'red') readinessScore = 0.0;
    }

    // B. Sling Integrity Score (40%) — derived directly from active rehab plan
    let slingScore = 1.0;
    if (activeRehab?.intervention_mode === 'red_stop') slingScore = 0.0;
    else if (activeRehab?.intervention_mode === 'yellow_pivot') slingScore = 0.5;
    else if (todayReadiness?.readiness_status === 'red') slingScore = 0.3;

    // C. History / Consistency (30%) - based on last 7 days of readiness checks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentChecks = readinessChecks.filter(r => new Date(r.check_date) >= sevenDaysAgo);

    let historyScore = 0.5; // Default if no data
    if (recentChecks.length > 0) {
      const avgScore = recentChecks.reduce((sum, r) => {
        if (r.readiness_status === 'green') return sum + 1.0;
        if (r.readiness_status === 'yellow') return sum + 0.5;
        return sum + 0.0; // red
      }, 0) / recentChecks.length;

      // Also factor in consistency (more check-ins = more reliable data)
      const consistencyBonus = Math.min(recentChecks.length / 7, 1.0) * 0.1;
      historyScore = Math.min(avgScore + consistencyBonus, 1.0);
    }

    // MCS Formula: 40% Sling, 30% Readiness, 30% History
    const mcs = Math.round(((slingScore * 0.4) + (readinessScore * 0.3) + (historyScore * 0.3)) * 100);

    // === 2. Weather Report Generation (Der "Wetterbericht") ===
    let weatherReport = {};
    if (mcs >= 80) {
        weatherReport = {
            decision: "training",
            status: "Peak Performance",
            mcs,
            color: "cyan",
            title: "Peak Performance",
            reason: "System ist hochgefahren. Optimale Bedingungen für Progression und neue Reize.",
            psychological_framing: "Du bist in Topform. Nutze die Energie für deine anspruchsvollsten Ziele.",
            recommendation: "Du bist in Topform. Nutze die Energie für deine anspruchsvollsten Ziele.",
            cta: { label: "Performance Training", page: "TrainingPlan" }
        };
    } else if (mcs >= 40) {
        weatherReport = {
            decision: "rehab_first",
            status: "Sanfter Flow",
            mcs,
            color: "emerald",
            title: "Sanfter Flow",
            reason: "Leichte Asymmetrien oder Ermüdung erkannt. Fokus auf Qualität statt Quantität.",
            psychological_framing: "Perfekter Tag, um deine Basis zu stärken. Wir arbeiten heute an deinen Schwachstellen.",
            recommendation: "Perfekter Tag, um deine Basis zu stärken. Wir arbeiten heute an deinen Schwachstellen.",
            cta: { label: "Rehab & Flow", page: "RehabPlan" }
        };
    } else {
        weatherReport = {
            decision: "rest",
            status: "Recovery",
            mcs,
            color: "slate",
            title: "System-Reset & Erholung",
            reason: "System beansprucht. Fokus auf Regeneration und Parasympathikus-Aktivierung.",
            psychological_framing: "Sarah sagt: 'Dein System konsolidiert gerade die letzten Reize. Gib deinen Neuronen Zeit, die neuen Pfade zu festigen.'",
            recommendation: "Sarah sagt: 'Dein System konsolidiert gerade die letzten Reize. Gib deinen Neuronen Zeit, die neuen Pfade zu festigen.'",
            cta: { label: "Recovery Flow", page: "FlowRoutines" }
        };
    }

    // === 3. Benchmark Transfer (Der "Kleber") ===
    let benchmarkTransferMessage = null;
    if (activeRehab && activeTraining && slingScore > 0.5) {
       benchmarkTransferMessage = "Deine Rehab-Arbeit zahlt sich aus: Deine Asymmetrien werden geringer!";
    }

    return Response.json({
      ...weatherReport,
      benchmarkTransferMessage,
      has_rehab: !!activeRehab,
      has_training: !!activeTraining,
    });

  } catch (error) {
    console.error('sessionGenerator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});