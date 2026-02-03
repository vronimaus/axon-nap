import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check UserNeuroProfile
    const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
    const hasNeuroprofile = profiles && profiles.length > 0;
    const complaintHistory = hasNeuroprofile ? (profiles[0].complaint_history || []) : [];

    // 2. Check RehabPlans
    const rehabPlans = await base44.entities.RehabPlan.filter({ user_email: user.email });
    const hasRehabPlans = rehabPlans && rehabPlans.length > 0;

    return Response.json({ 
      success: true,
      user_email: user.email,
      neuro_profile: {
        exists: hasNeuroprofile,
        complaint_history: complaintHistory,
        complaint_history_count: complaintHistory.length
      },
      rehab_plans: {
        exists: hasRehabPlans,
        count: rehabPlans?.length || 0,
        plans: rehabPlans?.map(p => ({
          id: p.id,
          symptom_location: p.symptom_location,
          status: p.status
        })) || []
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});