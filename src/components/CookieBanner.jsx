import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('axon_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('axon_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('axon_cookie_consent', 'declined');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-cyan-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Cookies & Datenschutz
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Wir verwenden notwendige Cookies, um die Funktionalität von AXON zu gewährleisten. 
                  Diese Cookies speichern Ihre Einstellungen und ermöglichen eine optimale Nutzung der App. 
                  Weitere Informationen finden Sie in unserer{' '}
                  <Link to={createPageUrl('Privacy')} className="text-cyan-400 hover:underline">
                    Datenschutzerklärung
                  </Link>.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleAccept}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    Akzeptieren
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800"
                  >
                    Nur notwendige
                  </Button>
                </div>
              </div>

              <button
                onClick={handleDecline}
                className="flex-shrink-0 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}