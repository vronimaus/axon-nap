import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, CreditCard } from 'lucide-react';

export default function TrialInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Wie funktioniert der AXON-Flow?
          </h1>
          <p className="text-lg text-slate-400">
            Zwei Wege, ein Ziel: Dein Potenzial freischalten
          </p>
        </motion.div>

        {/* Two Paths */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Path 1: Trial */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-cyan-500/30 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-cyan-400">7 Tage Vollversion</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">1</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Klick auf "7 Tage testen"</p>
                  <p className="text-sm text-slate-400">Du wirst zur Registrierung weitergeleitet</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">2</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Registrierung</p>
                  <p className="text-sm text-slate-400">E-Mail & Passwort – das war's</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">3</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Vollständiger Zugriff startet</p>
                  <p className="text-sm text-slate-400">7 Tage – alle Features, alle Tools, alles</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">4</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Nach 7 Tagen</p>
                  <p className="text-sm text-slate-400">Du wirst einmalig zur Zahlung aufgefordert (59€) oder dein Zugriff endet</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-sm text-cyan-300">
                ✓ Kein Abo
                <br />✓ Keine Kartendaten nötig im Trial
                <br />✓ Jederzeit kündbar
              </p>
            </div>
          </motion.div>

          {/* Path 2: Buy Now */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-purple-500/30 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-purple-400">Sofort kaufen</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">1</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Klick auf "Sofort kaufen"</p>
                  <p className="text-sm text-slate-400">Falls noch nicht eingeloggt: kurzer Login/Registrierung</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">2</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Zu Stripe weitergeleitet</p>
                  <p className="text-sm text-slate-400">Sichere Zahlungsseite – Karte oder andere Methoden</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">3</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Zahlung bestätigt</p>
                  <p className="text-sm text-slate-400">59€ Lifetime-Zugang – einmalig, fertig</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">4</span>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Direkt zur App</p>
                  <p className="text-sm text-slate-400">Sofortiger Zugriff – kein Warten</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-sm text-purple-300">
                ✓ Sofortiger Vollzugriff
                <br />✓ Einmalige Zahlung – dein Zugang für immer
                <br />✓ Sichere Stripe-Zahlungsseite
              </p>
            </div>
          </motion.div>
        </div>

        {/* Important Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-8"
        >
          <h3 className="text-xl font-bold text-yellow-400 mb-4">ℹ️ Wichtig zu wissen</h3>
          <div className="space-y-3 text-slate-300">
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p><strong>Kein Spam:</strong> Wir schicken dir nach dem Trial nur eine Erinnerung, danach Ruhe.</p>
            </div>
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p><strong>Sicher:</strong> Zahlungen laufen über Stripe – die führende Zahlungsplattform weltweit.</p>
            </div>
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p><strong>Keine Kreditkarte für Trial:</strong> Du brauchst keine Zahlungsdaten im 7-Tage-Test.</p>
            </div>
            <div className="flex gap-3">
              <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p><strong>Deine Daten gehören dir:</strong> AXON ist eine Web-App. Deine Session ist privat und bleibt bei dir.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}