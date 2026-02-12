const stripe = await import('npm:stripe@14.6.0');
const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { mode = 'direct', email } = body;
    const baseUrl = getBaseUrl(req);

    console.log('[createCheckoutSession] Request:', { mode, email, baseUrl });

    // Validate Stripe keys
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      console.error('[createCheckoutSession] Missing STRIPE_SECRET_KEY');
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Checkout Session erstellen (Hosted Checkout)
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: 5900,
          product_data: {
            name: 'AXON Protocol - Lebenslanger Zugriff',
            description: 'Einmalige Zahlung für unbegrenzten Zugriff auf alle AXON Features'
          }
        },
        quantity: 1
      }],
      success_url: `${baseUrl}/Success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/Landing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        checkout_mode: mode,
        customer_email: email || 'unknown'
      }
    });

    console.log('[createCheckoutSession] Session created:', session.id);

    return Response.json({
      sessionId: session.id,
      url: session.url
    });
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
  return 'https://axon-nap.de';
}