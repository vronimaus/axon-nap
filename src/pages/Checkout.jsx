import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';



export default function Checkout() {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initCheckout = async () => {
      try {
        // Create checkout session
        const response = await base44.functions.invoke('createCheckoutSession', {
          returnUrl: window.location.origin + createPageUrl('Profile')
        });

        if (response.data?.clientSecret && response.data?.publishableKey) {
          // Load Stripe - pass the promise directly
          const promise = loadStripe(response.data.publishableKey);
          setStripePromise(promise);
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error('Keine clientSecret oder publishableKey erhalten');
        }
      } catch (err) {
        console.error('Checkout init error:', err);
        setError(err?.message || 'Fehler beim Erstellen der Checkout-Session');
      } finally {
        setIsLoading(false);
      }
    };

    initCheckout();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center border border-red-500/30">
          <h2 className="text-xl font-bold text-red-400 mb-2">Fehler</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(createPageUrl('Profile'))}
            className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(createPageUrl('Profile'))}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="glass rounded-2xl p-8 border border-cyan-500/30 mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            AXON Freischalten
          </h1>
          <p className="text-slate-400">
            Zahle einmalig 59€ und erhalte unbegrenzten Zugriff auf alle AXON Features
          </p>
        </div>

        {clientSecret && stripe && (
          <EmbeddedCheckoutProvider
            stripe={Promise.resolve(stripe)}
            options={{
              clientSecret
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  );
}