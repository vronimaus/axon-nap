import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Nur für Admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Finde alle User deren Trial abgelaufen ist
    const allUsers = await base44.asServiceRole.entities.User.list();
    const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const usersToProcess = allUsers.filter(u => {
      if (u.has_paid) return false;
      if (!u.trial_start_date) return false;

      const trialEndTime = new Date(u.trial_start_date).getTime() + TRIAL_DURATION_MS;
      return now >= trialEndTime;
    });

    const results = [];

    for (const targetUser of usersToProcess) {
      // Stripe Customer erstellen falls nötig
      let customerId = targetUser.stripe_customer_id;

      if (!customerId) {
        const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `email=${encodeURIComponent(targetUser.email)}`
        });

        const customerData = await stripeResponse.json();
        customerId = customerData.id;

        // Speichere Customer ID
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          stripe_customer_id: customerId
        });
      }

      // Erstelle One-Time Payment Intent (59€)
      const piResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `amount=5900&currency=eur&customer=${customerId}&confirm=true&metadata[base44_app_id]=${Deno.env.get('BASE44_APP_ID')}&off_session=true`
      });

      const piData = await piResponse.json();

      if (piData.status === 'succeeded') {
        // Markiere User als bezahlt
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          has_paid: true
        });

        results.push({
          email: targetUser.email,
          status: 'payment_succeeded',
          payment_id: piData.id
        });
      } else {
        results.push({
          email: targetUser.email,
          status: 'payment_failed',
          error: piData.error?.message
        });
      }
    }

    return Response.json({
      success: true,
      processedUsers: results.length,
      results
    });
  } catch (error) {
    console.error('Error processing trial expiry:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});