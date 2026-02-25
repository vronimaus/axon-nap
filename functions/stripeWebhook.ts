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

    // Initialize Base44 client for service-role operations
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.metadata?.customer_email || session.customer_details?.email;

      if (!customerEmail) {
        console.error('No customer email in session');
        return Response.json({ error: 'No customer email' }, { status: 400 });
      }

      const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
      if (users.length === 0) {
        console.log('User nicht gefunden:', customerEmail);
        return Response.json({ received: true }, { status: 200 });
      }

      const user = users[0];
      const isTrialMode = session.metadata?.trial_mode === 'true';
      const updateData = {};
      
      if (isTrialMode) {
        // Bei Trial-Start: has_paid bleibt false, wir setzen das Trial-Startdatum
        updateData.has_paid = false;
        updateData.trial_start_date = new Date().toISOString();
      } else {
        // Bei Direktkauf: Sofort bezahlt
        updateData.has_paid = true;
      }

      await base44.asServiceRole.entities.User.update(user.id, updateData);
      console.log('Updated user after checkout:', user.id, updateData);

    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;

      // Wir ignorieren Rechnungen mit 0 (z.B. bei Anlage des Trials)
      if (invoice.amount_paid > 0 && customerEmail) {
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users.length > 0) {
          const user = users[0];
          
          // Nach 7 Tagen wurde die Rechnung bezahlt: User freischalten
          await base44.asServiceRole.entities.User.update(user.id, { has_paid: true });
          console.log('User has paid after trial:', user.id);

          // Abo kündigen, damit es kein wiederkehrendes Abo (im nächsten Jahr) bleibt!
          if (invoice.subscription) {
            await stripe.subscriptions.cancel(invoice.subscription);
            console.log('Subscription cancelled to make it a one-time charge:', invoice.subscription);
          }
        }
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});