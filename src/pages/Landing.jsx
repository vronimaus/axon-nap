import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, ChevronDown, Loader2, LogOut, Wrench, Brain, Dumbbell, Target, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

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

      {/* SEKTION 1: HERO - NEU */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900">
        {/* Body Map Background */}
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
            alt="AXON Body Map Background"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
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
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON Logo"
              loading="eager"
              decoding="async"
              className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Bewegung neu definiert.
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Schmerz an der Wurzel lösen.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            AXON vereint die Logik der Physiotherapie mit modernem Nervensystem-Training. Ein intelligenter Dialog für deinen Körper – jederzeit griffbereit.
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

      {/* SEKTION 2: WAS IST AXON? - NEU */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Was ist AXON?
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              AXON ist mehr als eine Trainings-App. Es ist dein <span className="text-cyan-400 font-semibold">persönlicher System-Spezialist</span>. Anstatt nur Symptome zu behandeln, führt dich AXON durch einen interaktiven Prozess, um Blockaden in deinen Kraftketten zu finden und gezielt zu lösen.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3">Intelligenter Diagnose-Chat</h3>
              <p className="text-slate-300 text-sm">
                Kein langes Suchen. Ein digitaler Assistent analysiert deine Bewegung und findet die Ursache für deine Beschwerden.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-purple-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Präzision ohne Ablenkung</h3>
              <p className="text-slate-300 text-sm">
                Wir verzichten auf schnelle Videos. Klare, hochwertige Illustrationen zeigen dir exakt, was zu tun ist – in deinem eigenen Tempo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-amber-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-3">Unabhängigkeit</h3>
              <p className="text-slate-300 text-sm">
                Warte nicht auf Termine. Werde dein eigener Experte und hilf dir selbst, wann und wo du es brauchst.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 3: METHODIK */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Die AXON-Methode: Das 3-Stufen-Protokoll
            </h2>
            <p className="text-slate-400 mt-4 max-w-3xl mx-auto">
              Dein Körper funktioniert in Ketten. AXON optimiert jede Ebene für ein reibungsloses Zusammenspiel.
            </p>
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
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">Basis-Korrektur (Gewebe)</h3>
              <p className="text-slate-300">
                Wir lösen mechanische Spannungen an 12 strategischen Punkten (AXON Nodes). Das befreit dein Bindegewebe und verbessert die Signalqualität an dein Gehirn.
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
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Steuerungs-Update (Nerven)</h3>
              <p className="text-slate-300">
                Über gezielte Impulse für Augen und Gleichgewicht signalisieren wir deinem Nervensystem „Sicherheit". Dein Gehirn lässt die Schutzspannung los und gibt neue Bewegungsfreiheit frei.
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
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Festigung (Integration)</h3>
              <p className="text-slate-300">
                Wir verankern die neue Freiheit in stabilen Mustern. Dein System lernt, die gewonnene Beweglichkeit dauerhaft in Kraft und schmerzfreie Bewegung umzusetzen.
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
              Dein System gibt den Takt vor
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
            Warum AXON?
          </h2>

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
          <p className="text-lg text-slate-400 text-center mb-12">
            Einmalzahlung. Kein Abo. Lebenslanger Zugriff.
          </p>

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
              className="glass rounded-2xl border border-amber-500/30 p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-2">VOLLE FREIHEIT</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">59€</span>
                <span className="text-slate-400">einmalig</span>
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