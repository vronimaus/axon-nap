import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    // Get signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    // Only handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const customerEmail = session.customer_details?.email;

      if (!userId) {
        console.error('No user_id in session metadata');
        return Response.json({ error: 'No user_id' }, { status: 400 });
      }

      // Initialize Base44 client for service-role operations
      const base44 = createClientFromRequest(req);

      // Setze Trial-Start wenn noch nicht gesetzt (für Trial-Mode)
      const isTrialMode = session.metadata?.trial_mode === 'true';
      const updateData = { has_paid: !isTrialMode };
      
      if (isTrialMode) {
        updateData.trial_start_date = new Date().toISOString();
      }

      // Update user basierend auf user_id, nicht auf email
      await base44.asServiceRole.entities.User.update(userId, updateData);
      console.log('Updated user:', userId, updateData);
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});