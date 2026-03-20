import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const appOrigin = body.appOrigin;
    
    if (!appOrigin) {
      throw new Error('appOrigin erforderlich');
    }
    
    console.log('Creating checkout session for:', appOrigin);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1SuZGlB2OaAKCdlODo4m1NtV',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appOrigin}/Success`,
      cancel_url: `${appOrigin}/Landing`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    console.log('Session created:', session.id, 'URL:', session.url);
    
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});