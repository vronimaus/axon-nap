import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch UserNeuroProfile
    const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
    console.log('All profiles:', JSON.stringify(profiles, null, 2));

    if (!profiles || profiles.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'Kein UserNeuroProfile vorhanden',
        profiles: []
      });
    }

    const profile = profiles[0];
    console.log('Profile complaint_history:', JSON.stringify(profile.complaint_history, null, 2));

    return Response.json({ 
      success: true,
      profile_id: profile.id,
      complaint_history: profile.complaint_history || [],
      complaint_history_length: profile.complaint_history?.length || 0,
      full_profile: profile
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});