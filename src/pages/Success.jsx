import React, { useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Success() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      window.location.href = createPageUrl('Landing');
      return;
    }

    // Prüfe ob User eingeloggt ist und leite zum Dashboard weiter
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          setTimeout(() => {
            window.location.href = createPageUrl('Dashboard');
          }, 2000);
        } else {
          // Sollte nicht passieren, da User vor Checkout einloggen muss
          window.location.href = createPageUrl('Landing');
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Zahlung erfolgreich!
        </h1>
        <p className="text-slate-400 mb-6">
          Du hast jetzt vollen Zugriff auf AXON Protocol
        </p>
        <div className="flex items-center justify-center gap-2 text-cyan-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Leite zum Dashboard weiter...</span>
        </div>
      </motion.div>
    </div>
  );
}