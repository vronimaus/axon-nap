import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const stripe = await import('npm:stripe@14.6.0');
const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode = 'trial', returnUrl } = await req.json();

    // Stripe Customer für diesen User
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          user_email: user.email
        }
      });
      customerId = customer.id;
      
      // User aktualisieren mit Stripe Customer ID
      await base44.asServiceRole.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Checkout Session erstellen
    const sessionConfig = {
      customer: customerId,
      mode: 'setup', // 'setup' speichert die Zahlungsmethode
      payment_method_types: ['card'],
      success_url: returnUrl || 'https://axonprotocol.app/dashboard',
      cancel_url: returnUrl || 'https://axonprotocol.app/landing',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
        trial_mode: mode === 'trial' ? 'true' : 'false'
      }
    };

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    // Bei "sofort kaufen": Charge sofort erstellen
    if (mode === 'direct') {
      const paymentMethods = await stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      if (paymentMethods.data.length > 0) {
        const paymentMethod = paymentMethods.data[0];
        
        const paymentIntent = await stripeClient.paymentIntents.create({
          customer: customerId,
          payment_method: paymentMethod.id,
          amount: 5900, // 59€ in cents
          currency: 'eur',
          confirm: true,
          off_session: true,
          metadata: {
            base44_app_id: Deno.env.get('BASE44_APP_ID'),
            user_id: user.id,
            checkout_mode: 'direct'
          }
        });

        if (paymentIntent.status === 'succeeded') {
          // Sofort als paid markieren
          await base44.asServiceRole.entities.User.update(user.id, {
            has_paid: true
          });

          return Response.json({ 
            success: true, 
            mode: 'direct',
            paymentIntentId: paymentIntent.id 
          });
        }
      }
    }

    return Response.json({ 
      sessionId: session.id,
      mode: mode
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});