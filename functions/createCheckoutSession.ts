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

    // Checkout Session erstellen
    const sessionConfig = {
      customer: customer.id,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: `${getBaseUrl(req)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(req)}/landing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        customer_email: email,
        trial_mode: mode === 'trial' ? 'true' : 'false',
        checkout_mode: mode
      }
    };

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

    return Response.json({ 
      sessionId: session.id,
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