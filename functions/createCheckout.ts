import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { origin } = new URL(req.url);
    
    console.log('Creating checkout session for:', origin);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1SuZGlB2OaAKCdlODo4m1NtV',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    console.log('Session created:', session.id, 'URL:', session.url);
    
    // Return redirect response
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});