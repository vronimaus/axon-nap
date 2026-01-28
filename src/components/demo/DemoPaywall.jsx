import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DemoPaywall() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      toast.error('Checkout funktioniert nur in der veröffentlichten App.');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const appOrigin = window.location.origin;
      const { data } = await base44.functions.invoke('createCheckout', { appOrigin });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Keine Checkout-URL erhalten');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fehler beim Laden des Checkouts.');
      setIsCheckoutLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass rounded-3xl border border-cyan-500/30 p-12 max-w-md w-full neuro-glow"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Demo vorbei 🎯
          </h2>

          <p className="text-slate-300 mb-8 leading-relaxed">
            Du hast deine 15 Minuten Gratistest genutzt. Jetzt wird's ernst – 
            schalte den vollständigen AXON-Zugang frei und beginne deine Reise zur echten Performance.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              size="lg"
              className="w-full text-lg py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow disabled:opacity-50"
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Lifetime Access freischalten – 59,- €
                </>
              )}
            </Button>

            <Link to={createPageUrl('Landing')} className="block">
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-slate-400 hover:text-cyan-400"
              >
                Zur Landing Page
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Sichere Zahlung via Stripe
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}