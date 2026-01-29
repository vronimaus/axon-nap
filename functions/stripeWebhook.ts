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
      const customerEmail = session.metadata?.customer_email || session.customer_details?.email;

      if (!customerEmail) {
        console.error('No customer email in session');
        return Response.json({ error: 'No customer email' }, { status: 400 });
      }

      // Initialize Base44 client for service-role operations
      const base44 = createClientFromRequest(req);

      // Finde User basierend auf Email
      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      if (users.length === 0) {
        console.log('User mit Email nicht gefunden (kann sein dass User sich später registriert):', customerEmail);
        return Response.json({ received: true }, { status: 200 });
      }

      const user = users[0];

      // Setze Trial-Start wenn noch nicht gesetzt (für Trial-Mode)
      const isTrialMode = session.metadata?.trial_mode === 'true';
      const updateData = { has_paid: !isTrialMode };
      
      if (isTrialMode) {
        updateData.trial_start_date = new Date().toISOString();
      }

      // Update user mit Checkout-Info
      await base44.asServiceRole.entities.User.update(user.id, updateData);
      console.log('Updated user:', user.id, updateData);
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});