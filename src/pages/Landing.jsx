import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, ChevronDown, Loader2, LogOut, Wrench, Brain, Dumbbell, Target, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stayOnLanding = localStorage.getItem('stay_on_landing') === 'true';
        const urlParams = new URLSearchParams(window.location.search);
        const previewMode = urlParams.get('preview') === 'true';

                try {
                  const currentUser = await base44.auth.me();
                  setUser(currentUser);

                  // Skip redirect wenn explizit auf Landing bleiben oder Preview-Modus
                  if (stayOnLanding || previewMode) {
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
                  // User nicht eingeloggt - das ist ok, Landing ist öffentlich
                  setUser(null);
                }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleSelectOption = (mode) => {
    // Track conversion event
    base44.analytics.track({
      eventName: mode === 'trial' ? 'trial_started' : 'direct_purchase_initiated',
      properties: { source: 'landing_page' }
    });

    // Speichere die gewählte Option für nach dem Login
    localStorage.setItem('axon_selected_mode', mode);
    
    // Leite zum Login/Registrierung weiter
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Helmet>
        <link rel="preconnect" href="https://qtrypzzcjebvfcihiynt.supabase.co" />
        <link rel="preload" as="image" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/b5f2dad61_BodyMap271x7001.png" />
        
        {/* Primary Meta Tags */}
        <title>AXON - Neuro-Athletic Protocol | Fitness neu gedacht</title>
        <meta name="description" content="AXON kombiniert neurozentriertes Training, Faszienmobilität und funktionale Bewegung für nachhaltige Gesundheit. Starte jetzt deine 7-Tage-Testversion." />
        <meta name="keywords" content="Neuro-Training, Faszienmobilität, Funktionelles Training, Rehabilitation, Performance Training, MFR, Mobility" />
        <link rel="canonical" href="https://app.base44.com" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.base44.com" />
        <meta property="og:title" content="AXON - Neuro-Athletic Protocol | Fitness neu gedacht" />
        <meta property="og:description" content="Revolutionäres Training für deinen Körper und Geist. 7 Tage kostenlos testen." />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:site_name" content="AXON Protocol" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://app.base44.com" />
        <meta name="twitter:title" content="AXON - Neuro-Athletic Protocol" />
        <meta name="twitter:description" content="Revolutionäres Training für deinen Körper und Geist. 7 Tage kostenlos testen." />
        <meta name="twitter:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png" />

        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AXON Protocol",
            "url": "https://app.base44.com",
            "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png",
            "description": "Neuro-Athletic Protocol für nachhaltige Gesundheit und Performance",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Marienstr. 40",
              "postalCode": "50374",
              "addressLocality": "Erftstadt",
              "addressCountry": "DE"
            }
          })}
        </script>

        {/* Structured Data - Product */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "AXON Protocol - Lebenslanger Zugriff",
            "description": "Neuro-Athletic Training App mit personalisierten Trainingsplänen, Rehabilitation und Flow-Routinen",
            "brand": {
              "@type": "Brand",
              "name": "AXON"
            },
            "offers": {
              "@type": "Offer",
              "price": "59.00",
              "priceCurrency": "EUR",
              "priceValidUntil": "2026-12-31",
              "availability": "https://schema.org/InStock",
              "url": "https://app.base44.com"
            }
          })}
        </script>

        {/* Structured Data - WebApplication */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AXON Protocol",
            "url": "https://app.base44.com",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "59.00",
              "priceCurrency": "USD"
            },
            "description": "Neuro-Athletic Protocol mit Rehabilitation, Performance Training und Flow Routinen"
          })}
        </script>
      </Helmet>

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
            <Link to={createPageUrl('KnowledgeHub')}>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400">
                Knowledge Hub
              </Button>
            </Link>
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

      {/* SEKTION 1: HERO - NEU */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900">
        {/* Body Map Background */}
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/b5f2dad61_BodyMap271x7001.png"
            alt="AXON Body Map Background"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-30"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-slate-950/50 to-slate-900/70" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/60d205ae0_AxonLogo180x35.png"
              alt="AXON Logo"
              loading="eager"
              decoding="async"
              width="180"
              height="35"
              className="w-48 h-auto mx-auto object-contain drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Verstehe dein System.
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Optimiere deine Bewegung.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Werde dein eigener Experte. AXON vereint Faszien-Release, Neuro-Athletik und funktionelles Training – für absolute Freiheit im Alltag und maximale Präzision im Sport.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              onClick={() => handleSelectOption('trial')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              <Zap className="w-5 h-5 mr-2" />
              7 Tage kostenlos testen
            </Button>
            <Button
              onClick={() => handleSelectOption('direct')}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            >
              Sofort kaufen – 59€
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>30 Tage Geld-zurück-Garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>Keine versteckten Kosten</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span>Kein Abo</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 2: WARUM AXON? - Autonomie-Faktor */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Warum AXON?
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-cyan-400 mb-6">
              Schluss mit dem Wartezimmer. Willkommen im System-Check.
            </h3>
            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
              Du kennst deinen Körper am besten – AXON liefert dir das Werkzeug, um ihn zu steuern. Ob es das Zwicken im unteren Rücken nach dem Büro ist oder das Leistungsplateau beim Training: Die Ursache liegt fast immer in der Kommunikation zwischen Gehirn und Muskulatur.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-6"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3 text-center">Kein Warten mehr</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Löse Spannungen genau dann, wenn sie entstehen. 24/7, direkt in deiner Hosentasche.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-purple-500/30 p-6"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">Kein Rätselraten</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Der intelligente Diagnose-Chat findet die Schwachstelle in deiner Kette, während andere noch Symptome massieren.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-amber-500/30 p-6"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-3 text-center">Echte Expertise</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Wir geben dir nicht nur Übungen, sondern das Wissen dahinter. Verstehe, wie deine Augen, dein Gleichgewicht und dein Gewebe zusammenspielen.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 3: IN 3 SCHRITTEN ZUR MEISTERSCHAFT */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              In 3 Schritten zur Meisterschaft
            </h2>
            <p className="text-slate-400 mt-4 max-w-3xl mx-auto">
              Dein Körper funktioniert in Ketten. AXON optimiert jede Ebene für ein reibungsloses Zusammenspiel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* System-Audit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">System-Audit (Der Dialog)</h3>
              <p className="text-slate-300">
                Per Chat analysieren wir deinen aktuellen Status. Wir scannen deine Kraftketten (Front-Drive, Back-Power, Torque-Flow) und identifizieren die neuronale Bremse.
              </p>
            </motion.div>

            {/* Bio-Sync */}
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
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Bio-Sync (Die Kalibrierung)</h3>
              <p className="text-slate-300">
                Vor jeder Einheit checken wir deine Tagesform. Wir passen die Belastung in Echtzeit an dein Nervensystem an. Das ist intelligentes Training, das dich schützt und gleichzeitig fordert.
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
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Integration (Das Upgrade)</h3>
              <p className="text-slate-300">
                Wir festigen die neue Bewegungsfreiheit durch gezielte Reize. Dein Gehirn lernt, dass die neue Kraft sicher ist und gibt sie dauerhaft frei.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 4: DIE 3 SÄULEN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
            Drei Wege zu deinem Ziel
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12 max-w-3xl mx-auto">
            Egal ob du Schmerzen lösen, Performance steigern oder dein System pflegen willst – AXON begleitet dich auf jedem Schritt.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-red-500/30 p-8 hover:border-red-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mb-3 text-center">REHAB – Ursachen lösen</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Akute Blockaden? Der AXON-Check scannt deine Kraftlinien (Front-Drive, Back-Power, Torque-Flow) und findet den Ursprung deiner Beschwerden. Du erhältst ein präzises Protokoll, um dein System Schritt für Schritt wieder schmerzfrei zu machen.
              </p>
            </motion.div>

            {/* FLOW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8 hover:border-cyan-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 mx-auto">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3 text-center">FLOW – Den Körper pflegen</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Deine tägliche Wartung in 5–15 Minuten. Kurze, bebilderte Routinen scannen dein System, lösen Steifheit aus dem Alltag und halten deine Gelenke geschmeidig. Wie Zähneputzen – nur für deine Beweglichkeit.
              </p>
            </motion.div>

            {/* GOALS (ehemals PERFORMANCE) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-amber-500/30 p-8 hover:border-amber-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-amber-400 mb-3 text-center">GOALS – Potenziale nutzen</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Setze dir sportliche Meilensteine. Ob die ersten 10 Klimmzüge oder mehr Stabilität beim Laufen: AXON analysiert deine Voraussetzungen und baut dein Training logisch auf, damit dein Nervensystem maximale Leistung freigibt.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 5: PERSONALISIERUNG & KI */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Du verstehst dein System – AXON passt sich an
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-purple-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Der Daily Readiness Check</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Kein Tag ist wie der andere. AXON fragt dich morgens kurz nach Energie, Schlaf und Stress. Die App passt deine Empfehlungen sofort an deine Tagesform an.
              </p>
              <p className="text-sm text-slate-400">
                <strong>Grün:</strong> Dein System ist bereit für volle Belastung.<br />
                <strong>Gelb:</strong> Moderates Training zur Erhaltung.<br />
                <strong>Rot:</strong> Fokus auf Erholung und sanfte Impulse.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Intelligente Anpassung</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                AXON lernt dich kennen. Die App trackt deine Fortschritte, erkennt Muster und passt deine Trainingspläne dynamisch an. Je länger du AXON nutzt, desto besser werden die Empfehlungen.
              </p>
              <p className="text-sm text-slate-400">
                Deine Daten bleiben privat – sie werden nur genutzt, um dich besser zu unterstützen.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 6: APP SCREENSHOTS */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            So sieht AXON aus
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Drei Modi, ein System – speziell für deine Bedürfnisse
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-red-500/30 overflow-hidden group cursor-pointer"
            >
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/340d9305f_image.png"
                  alt="REHAB - Body Map"
                  loading="lazy"
                  decoding="async"
                  width="500"
                  height="1000"
                  className="w-full h-auto transition-opacity duration-500 group-hover:opacity-0"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/01a4d2bc5_image.png"
                  alt="REHAB - Diagnose & Protokoll"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto absolute top-0 left-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-red-400 mb-1">REHAB</h3>
                <p className="text-xs text-slate-400">Body Map → Diagnose → Präzises Protokoll</p>
              </div>
            </motion.div>

            {/* GOALS Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-amber-500/30 overflow-hidden group cursor-pointer"
            >
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/bb6563719_image.png"
                  alt="GOALS - Ziel eingeben"
                  loading="lazy"
                  decoding="async"
                  width="500"
                  height="1000"
                  className="w-full h-auto transition-opacity duration-500 group-hover:opacity-0"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/0c5ccc3ac_image.png"
                  alt="GOALS - Analyse & Plan"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto absolute top-0 left-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-amber-400 mb-1">GOALS</h3>
                <p className="text-xs text-slate-400">Ziel → Analyse → Personalisierter Trainingsplan</p>
              </div>
            </motion.div>

            {/* FLOW Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-cyan-500/30 overflow-hidden group cursor-pointer"
            >
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ae4e694e6_image.png"
                  alt="FLOW - Kategorien"
                  loading="lazy"
                  decoding="async"
                  width="500"
                  height="1000"
                  className="w-full h-auto transition-opacity duration-500 group-hover:opacity-0"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/d0f3bbdb8_image.png"
                  alt="FLOW - Trainingsplan Details"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto absolute top-0 left-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-cyan-400 mb-1">FLOW</h3>
                <p className="text-xs text-slate-400">Kategorie → Trainingsplan mit allen Details</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 7: WARUM AXON */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Werde Early Member
          </h2>
          <p className="text-lg text-slate-300 text-center mb-8 max-w-3xl mx-auto">
            Wir glauben an Wissen, das bleibt. Deshalb gibt es bei AXON keine Abos und keine versteckten Kosten. Du sicherst dir den lebenslangen Zugang zu deinem persönlichen System-Experten <span className="text-amber-400 font-semibold">für weniger als eine einzige Physiotherapie-Sitzung.</span>
          </p>

          <h3 className="text-3xl md:text-4xl font-bold text-center text-white mb-8 mt-16">
            Warum AXON?
          </h3>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl border border-cyan-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3">Wissenschaft statt Spielerei</h3>
              <p className="text-sm text-slate-300">
                Basierend auf globalen Standards der Biomechanik und Neuro-Athletik.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl border border-purple-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Verstehe deinen Körper</h3>
              <p className="text-sm text-slate-300">
                AXON erklärt dir nicht nur, was du tun sollst, sondern auch warum. Du lernst die Zusammenhänge deines Körpers verstehen.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl border border-amber-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-3">Einmal zahlen, ewig nutzen</h3>
              <p className="text-sm text-slate-300">
                Wir glauben nicht an Abos. Einmaliger Kauf, lebenslange Unterstützung für dein System.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-cyan-500/30 p-8 text-center mb-16"
          >

          </motion.div>
        </div>
      </section>

      {/* SEKTION 8: PREISE */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Wähle deinen Einstieg
          </h2>
          <p className="text-lg text-slate-400 text-center mb-4">
            Einmalzahlung. Kein Abo. Lebenslanger Zugriff.
          </p>
          <div className="text-center mb-8">
            <p className="text-sm text-amber-400 font-semibold">
              🚀 Limitiertes Launch-Angebot für die ersten 1.000 Early Members
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold">
                EMPFOHLEN
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">TEST-PHASE</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-cyan-400">0€</span>
                <span className="text-slate-400">dann 59€</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>7 Tage vollständiger Zugriff auf alle Features</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Danach einmalig 59€ – kein Abo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Jederzeit während der Testphase kündbar</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-green-400">30 Tage Geld-zurück-Garantie</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSelectOption('trial')}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-semibold"
              >
                Jetzt kostenlos starten
              </Button>
            </motion.div>

            {/* Direct Purchase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-amber-500/30 p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold">
                🚀 LAUNCH SPECIAL
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">VOLLE FREIHEIT</h3>
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl font-bold text-slate-500 line-through">149€</span>
                  <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">59€</span>
                  <span className="text-slate-400">einmalig</span>
                </div>
                <p className="text-xs text-amber-400 font-semibold">Du sparst 90€ als Early Member</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Sofortiger Zugriff auf alle Features</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Einmalzahlung – lebenslanger Zugang</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Kein Abo, keine versteckten Kosten</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-green-400">30 Tage Geld-zurück-Garantie</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSelectOption('direct')}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                Jetzt kaufen
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