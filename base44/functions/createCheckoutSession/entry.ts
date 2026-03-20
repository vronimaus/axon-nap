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
    let sessionConfig = {
      payment_method_types: ['card', 'paypal'],
      customer_email: email || undefined,
      success_url: `${baseUrl}/Success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/Landing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        trial_mode: mode === 'trial' ? 'true' : 'false',
        customer_email: email || 'unknown'
      }
    };

    if (mode === 'trial') {
      // 7-Tage Testversion (Abo mit Trial)
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [{
        price: 'price_1T4ekJ7Pl2EHjBzrKwG2mEmV', // Recurring Price (Yearly)
        quantity: 1
      }];
      sessionConfig.subscription_data = {
        trial_period_days: 7
      };
      sessionConfig.custom_text = {
        submit: {
          message: "Wichtiger Hinweis: Stripe zeigt hier systembedingt 'pro Jahr' an. Es wird jedoch garantiert nur EINMALIG abgebucht (Lebenslanger Zugriff). Wir beenden das Abo nach der Zahlung automatisch."
        }
      };
    } else {
      // Direktkauf (Einmalzahlung)
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price: 'price_1T05KL7Pl2EHjBzr4GJT5KiK', // One-time Price
        quantity: 1
      }];
    }

    const session = await stripeClient.checkout.sessions.create(sessionConfig);

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