import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { returnUrl } = await req.json();

    if (!returnUrl) {
      return Response.json({ error: 'returnUrl erforderlich' }, { status: 400 });
    }

    // Fetch Stripe (no user auth needed for public app)
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price]': 'price_1SuZGlB2OaAKCdlODo4m1NtV', // 59€ one-time price
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': returnUrl,
        'cancel_url': returnUrl,
        'metadata[base44_app_id]': Deno.env.get('BASE44_APP_ID')
      }).toString()
    });

    const session = await stripeResponse.json();

    if (!session.id) {
      console.error('Stripe error:', session);
      return Response.json(
        { error: 'Checkout-Session konnte nicht erstellt werden', details: session.error },
        { status: 400 }
      );
    }

    return Response.json({ sessionId: session.id, publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});