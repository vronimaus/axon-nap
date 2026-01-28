import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { origin } = new URL(req.url);
    
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

    // Redirect to Stripe Checkout
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${session.id}`;
    return Response.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});