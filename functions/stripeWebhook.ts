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
      const customerEmail = session.customer_details?.email;

      if (!customerEmail) {
        console.error('No customer email in session');
        return Response.json({ error: 'No email' }, { status: 400 });
      }

      // Initialize Base44 client for service-role operations
      const base44 = createClientFromRequest(req);

      // Check if user exists
      let user = await base44.asServiceRole.entities.User.filter({ email: customerEmail });

      if (!user || user.length === 0) {
        // Create new user with paid status
        await base44.asServiceRole.users.inviteUser(customerEmail, 'user');
        console.log('Created new user:', customerEmail);
      }

      // Update user as paid
      if (user && user.length > 0) {
        await base44.asServiceRole.entities.User.update(user[0].id, { has_paid: true });
        console.log('Marked user as paid:', customerEmail);
      } else {
        // If user was just created via invite, update after a short delay
        setTimeout(async () => {
          const updatedUser = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
          if (updatedUser && updatedUser.length > 0) {
            await base44.asServiceRole.entities.User.update(updatedUser[0].id, { has_paid: true });
            console.log('Marked newly created user as paid:', customerEmail);
          }
        }, 1000);
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});