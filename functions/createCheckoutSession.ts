const stripe = await import('npm:stripe@14.6.0');
const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { mode = 'direct', email, returnUrl } = body;

    console.log('[createCheckoutSession] Request:', { mode, email, returnUrl });

    // Stripe Customer erstellen
    const customer = await stripeClient.customers.create({
      email: email || undefined,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        checkout_mode: mode
      }
    });

    console.log('[createCheckoutSession] Customer created:', customer.id);

    // Payment Intent für Embedded Checkout
    const paymentIntent = await stripeClient.paymentIntents.create({
      customer: customer.id,
      amount: 5900,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        customer_email: email || 'unknown',
        checkout_mode: mode
      }
    });

    console.log('[createCheckoutSession] PaymentIntent created:', paymentIntent.id);

    const result = {
      clientSecret: paymentIntent.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      mode,
      email
    };

    console.log('[createCheckoutSession] Returning:', { 
      hasClientSecret: !!result.clientSecret, 
      hasPublishableKey: !!result.publishableKey 
    });

    return Response.json(result);
  } catch (error) {
    console.error('[createCheckoutSession] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getBaseUrl(req) {
  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (origin) {
    return new URL(origin).origin;
  }
  return 'https://axonprotocol.app';
}