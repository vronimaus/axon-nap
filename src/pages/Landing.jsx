import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, ChevronDown, Loader2, LogOut, Zap as ZapIcon, Wrench, Brain, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Landing() {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stayOnLanding = localStorage.getItem('stay_on_landing') === 'true';
        
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Prüfe ob Checkout pending ist (nach Login)
                const pendingCheckout = localStorage.getItem('pending_checkout_mode');
                if (pendingCheckout) {
                  localStorage.removeItem('pending_checkout_mode');
                  // Starte Checkout direkt
                  handleCheckout(pendingCheckout);
                  return;
                }

                // Skip redirect wenn explizit auf Landing bleiben
                if (stayOnLanding) {
                  setIsLoading(false);
                  return;
                }
        
        // Eingeloggte User + bezahlt - zum Dashboard
        if (currentUser?.has_paid) {
          window.location.href = createPageUrl('Dashboard');
          return;
        }
        
        // Eingeloggte User + aktiver Trial - zum Dashboard
        if (currentUser && currentUser.trial_start_date) {
          const startDate = new Date(currentUser.trial_start_date);
          const now = new Date();
          const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
          if (daysElapsed < 7) {
            window.location.href = createPageUrl('Dashboard');
            return;
          }
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleCheckout = async (mode) => {
    if (!user) {
      // Speichere den Checkout-Modus und redirect zum Login
      localStorage.setItem('pending_checkout_mode', mode);
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (window.self !== window.top) {
      toast.error('Checkout funktioniert nur in der veröffentlichten App.');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCheckoutSession', {
        mode,
        returnUrl: window.location.href
      });

      if (mode === 'direct' && data.success) {
        // Sofortiger Zugriff gewährt
        toast.success('Zahlung erfolgreich! Du hast jetzt lebenslangen Zugriff.');
        setTimeout(() => {
          window.location.href = createPageUrl('Dashboard');
        }, 1500);
        return;
      }

      if (data.sessionId) {
        // Trial oder Setup - zu Stripe Checkout
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Fehler beim Laden des Checkouts.');
      setIsCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON"
              className="w-8 h-8"
            />
            <span className="font-bold text-cyan-400">AXON</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={createPageUrl('Dashboard')}>
                  <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400">
                    Zur App
                  </Button>
                </Link>
                <button
                  onClick={() => base44.auth.logout()}
                  className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* SEKTION 1: HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON Logo"
              className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Dein Gehirn bremst dich aus –
            </span>
            <br />
            <span className="text-white">wir lösen die Handbremse.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Schmerz und Steifheit sind oft keine Hardware-Fehler, sondern Schutzsignale deiner Software. Nutze das AXON Protocol, um Blockaden systematisch zu deuten und dein volles Potenzial sicher freizuschalten.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Button
              onClick={() => handleCheckout('trial')}
              disabled={isCheckoutLoading}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-white active:text-white"
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  7 Tage kostenlos testen
                </>
              )}
            </Button>
            <Button
              onClick={() => handleCheckout('direct')}
              disabled={isCheckoutLoading}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Sofort kaufen – 59€
                </>
              )}
            </Button>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl border border-cyan-500/20 p-6 max-w-2xl mx-auto mb-12"
          >
            <p className="text-sm text-slate-300 text-center">
              <strong>7 Tage Testphase:</strong> Danach einmalig 59€. Jederzeit während der Testphase mit einem Klick kündbar. Kein Risiko.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-3xl mx-auto"
          >
            <div className="glass rounded-2xl border border-cyan-500/30 overflow-hidden neuro-glow">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
                alt="AXON Body Map"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 2: METHODIK */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Die neurozentrierte Kette
            </h2>
            <p className="text-xl text-slate-400">Hardware ➔ Software ➔ Integration</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Hardware */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">Hardware-Check (MFR)</h3>
              <p className="text-slate-300">
                Wir lösen mechanische Spannungen an 12 strategischen Nodes, um die Informationsqualität deiner Sensoren zu verbessern.
              </p>
            </motion.div>

            {/* Software */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Software-Update (Neuro)</h3>
              <p className="text-slate-300">
                Wir kalibrieren dein visuelles und vestibuläres System (Augen & Gleichgewicht), um deinem Gehirn das Signal „Sicherheit" zu senden.
              </p>
            </motion.div>

            {/* Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-purple-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Integration (Belastung)</h3>
              <p className="text-slate-300">
                Wir festigen die neue Freiheit durch gezielte Kraftreize. So speichert dein Nervensystem den Fortschritt dauerhaft.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 3: DIE 3 SÄULEN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">
            Die 3 Säulen
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="text-5xl mb-4">🟠</div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">REHAB</h3>
              <p className="text-slate-300 leading-relaxed">
                Wenn dein System „bremst", hat das einen Grund. Statt Symptome zu bekämpfen, nutzen wir die AXON-Matrix, um den Ursprung der Schutzspannung zu finden. Präzise Resets für Rücken, Nacken und Gelenke.
              </p>
            </motion.div>

            {/* FLOW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="text-5xl mb-4">🔵</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">FLOW</h3>
              <p className="text-slate-300 leading-relaxed">
                „Zähneputzen für dein Nervensystem". Unsere 5- bis 10-minütigen Routinen sind die tägliche Wartung für deinen Körper. Einmal durch das gesamte System scannen, Steifheit lösen und Linien aktivieren – bevor Probleme entstehen.
              </p>
            </motion.div>

            {/* PERFORMANCE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-yellow-500/30 p-8"
            >
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">PERFORMANCE</h3>
              <p className="text-slate-300 leading-relaxed">
                Wahre Stärke entsteht im Kopf. Nur wenn dein Gehirn eine Bewegung als sicher einstuft, gibt es die maximale Kraft frei. Erreiche athletische Meilensteine durch ein Protokoll, das Biologie und Training vereint.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 4: WORKFLOW SEQUENCE */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Der Complete Reset in 15 Minuten
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Hardware lösen → Gehirn kalibrieren → Bewegung verankern
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Hardware */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">Hardware</h3>
              <p className="text-slate-300 mb-4">
                90 Sekunden Druck auf einen kritischen Node
              </p>
              <p className="text-sm text-slate-400">
                Spannungen lösen, Sensoren kalibrieren
              </p>
            </motion.div>

            {/* Software */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Software</h3>
              <p className="text-slate-300 mb-4">
                3 Min Neuro-Drill für Augen & Gleichgewicht
              </p>
              <p className="text-sm text-slate-400">
                Gehirn signalisiert „Sicherheit"
              </p>
            </motion.div>

            {/* Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-purple-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Integration</h3>
              <p className="text-slate-300 mb-4">
                5 konzentrierte Wiederholungen einer Kraft-Bewegung
              </p>
              <p className="text-sm text-slate-400">
                Nervensystem verankert den Fortschritt
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 glass rounded-2xl border border-purple-500/30 p-8 text-center bg-gradient-to-r from-purple-500/5 to-cyan-500/5"
          >
            <p className="text-lg text-white font-semibold">
              Ergebnis: Bessere Mobilität, neue Kraft-Reserve, entspanntes Nervensystem
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 5: READINESS CHECK */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass rounded-2xl border border-purple-500/30 p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Dein System gibt den Takt vor
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Kein Körper ist jeden Tag gleich. AXON fragt dich täglich nach deinem Energie-Level und Stress-Status. Die App empfiehlt dir daraufhin exakt die Routine, die dein Nervensystem heute verarbeiten kann.
            </p>
          </div>
        </div>
      </section>

      {/* SEKTION 6: PRICING - 2 KACHELN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Wähle deine Option
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12">
            Kein Abo. Keine versteckten Kosten. AXON ist ein technisches Handbuch für deinen Körper, das dir für immer gehört.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Teste kostenlos</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-cyan-400">0€</span>
                <span className="text-slate-400">7 Tage</span>
              </div>
              <p className="text-slate-300 mb-8">
                Gebe deine Zahlungsdaten ein und teste 7 Tage alle Funktionen kostenlos. Danach buchen wir 59 € ab. Solltest du mit AXON keine Spannungen lösen können, kündige einfach innerhalb der Testphase.
              </p>
              <Button
                onClick={() => handleCheckout('trial')}
                disabled={isCheckoutLoading}
                size="lg"
                variant="outline"
                className="w-full text-slate-900 border-cyan-500/50 hover:bg-cyan-500/20 hover:text-slate-900 active:text-slate-900 font-semibold"
              >
                {isCheckoutLoading ? 'Lädt...' : '7 Tage kostenlos testen'}
              </Button>
            </motion.div>

            {/* Direct Purchase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-purple-500/30 p-8 bg-gradient-to-br from-purple-500/10 to-transparent"
            >
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold">
                SOFORT ZUGRIFF
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sofort kaufen</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">59€</span>
                <span className="text-slate-400">einmalig</span>
              </div>
              <p className="text-slate-300 mb-8">
                Wie eine Sitzung bei deinem Therapeuten – aber 24/7 für dich da. Bessere Mobilität, neue Kraft-Reserve, entspanntes Nervensystem. Unbegrenzter lebenslanger Zugriff.
              </p>
              <Button
                onClick={() => handleCheckout('direct')}
                disabled={isCheckoutLoading}
                size="lg"
                className="w-full text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
              >
                {isCheckoutLoading ? 'Lädt...' : 'Sofort kaufen'}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2026 AXON Protocol | Neuro-Athletic Excellence</p>
        </div>
      </footer>
    </div>
  );
}