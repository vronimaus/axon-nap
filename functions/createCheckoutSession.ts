const stripe = await import('npm:stripe@14.6.0');
const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { mode = 'trial', email } = await req.json();

    // Stripe Customer erstellen mit Email (kein User-Login erforderlich)
    const customer = await stripeClient.customers.create({
      email: email || undefined,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        checkout_mode: mode
      }
    });

    // Payment Intent für Embedded Checkout erstellen
    const paymentIntent = await stripeClient.paymentIntents.create({
      customer: customer.id,
      amount: 5900, // 59€ in cents
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        customer_email: email,
        trial_mode: mode === 'trial' ? 'true' : 'false',
        checkout_mode: mode
      }
    });

    return Response.json({ 
      clientSecret: paymentIntent.client_secret,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      mode: mode,
      email: email,
      success: true
    });
  } catch (error) {
    console.error('Checkout error:', error);
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