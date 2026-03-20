import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete all TrainingPlans
    const trainingPlans = await base44.asServiceRole.entities.TrainingPlan.list('-updated_date', 1000);
    for (const plan of trainingPlans) {
      await base44.asServiceRole.entities.TrainingPlan.delete(plan.id);
    }
    console.log(`Deleted ${trainingPlans.length} TrainingPlans`);

    // Delete all RehabPlans
    const rehabPlans = await base44.asServiceRole.entities.RehabPlan.list('-updated_date', 1000);
    for (const plan of rehabPlans) {
      await base44.asServiceRole.entities.RehabPlan.delete(plan.id);
    }
    console.log(`Deleted ${rehabPlans.length} RehabPlans`);

    // Delete all RoutineHistory
    const routineHistories = await base44.asServiceRole.entities.RoutineHistory.list('-updated_date', 1000);
    for (const history of routineHistories) {
      await base44.asServiceRole.entities.RoutineHistory.delete(history.id);
    }
    console.log(`Deleted ${routineHistories.length} RoutineHistories`);

    return Response.json({
      success: true,
      deleted: {
        trainingPlans: trainingPlans.length,
        rehabPlans: rehabPlans.length,
        routineHistories: routineHistories.length,
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});