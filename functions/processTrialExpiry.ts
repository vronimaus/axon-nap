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
      if (u.has_paid || u.subscription_active || u.subscription_cancelled) return false;
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

      // Erstelle Subscription
      const subResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `customer=${customerId}&items[0][price]=${Deno.env.get('STRIPE_PRICE_ID')}&metadata[base44_app_id]=${Deno.env.get('BASE44_APP_ID')}&off_session=true`
      });

      const subData = await subResponse.json();

      if (subData.id) {
        // Markiere User als mit aktiver Subscription
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          subscription_active: true
        });

        results.push({
          email: targetUser.email,
          status: 'subscription_created',
          subscription_id: subData.id
        });
      } else {
        results.push({
          email: targetUser.email,
          status: 'error',
          error: subData.error?.message
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