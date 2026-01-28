import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, MapPin, Brain, Shield, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: MapPin, title: 'Visual Mapping', desc: 'Zeichne deinen Schmerz auf das digitale 3D-Modell' },
    { icon: Brain, title: 'Neural Analysis', desc: 'AXON übersetzt in Faszien- und Nervenketten' },
    { icon: Zap, title: '30-Sec Fix', desc: 'Spezifische Drills lösen deine neuronale Bremse' }
  ];

  const masterGoals = [
    '🎯 Pistol Squat', '🌉 Bridge', '🦅 Handstand', 
    '💎 Dragon Squat', '🧘 Pancake', '⚡ L-Sit'
  ];

  const benefits = [
    'Vollständige Body-Map Analyse',
    'Alle 12 Performance-Ziele (Level 1-5)',
    'Über 50+ Neuro-Drills',
    'Web-App: Direktzugriff auf jedem Gerät',
    'Lifetime Updates inklusive',
    'Keine monatlichen Kosten'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON Logo"
              className="w-24 h-24 mx-auto object-contain"
            />
          </motion.div>

          {/* Headline */}
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
            <span className="text-white">
              wir lösen die Handbremse.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Schmerz ist kein kaputtes Bauteil, sondern ein Schutzsignal deines Gehirns. 
            Nutze die visuelle AXON Body-Map, um Blockaden in deinen Leitbahnen zu finden 
            und per „Software-Reboot" sofort mehr Bewegungsfreiheit zu gewinnen.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              onClick={() => scrollToSection('pricing')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              <Zap className="w-5 h-5 mr-2" />
              Jetzt AXON Lifetime-Zugang sichern
            </Button>
            <Link to={createPageUrl('Dashboard')}>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                Demo ansehen
              </Button>
            </Link>
          </motion.div>

          {/* Visual Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="glass rounded-3xl border border-cyan-500/30 overflow-hidden neuro-glow">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
                alt="AXON Body Map"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, repeat: Infinity, duration: 2 }}
            className="mt-12"
          >
            <ChevronDown className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Rehab Focus: 60% */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass rounded-3xl border border-red-500/30 p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
              Die Synergie von Mechanik und Neurologie
            </h2>
            <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
              <p>
                Die meisten Ansätze konzentrieren sich nur auf die Hardware (Muskeln und Gewebe). 
                Doch wenn die Spannung nach Massage oder Faszientraining immer wieder zurückkehrt, 
                liegt das an der Software (deinem Nervensystem). 
                <span className="text-red-400 font-semibold"> Dein Gehirn hält das Schutzprogramm künstlich aufrecht.</span>
              </p>

              {/* Das AXON 3-Stufen-System */}
              <h3 className="text-2xl font-bold text-cyan-400 mt-8 mb-4">Das AXON 3-Stufen-System:</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="p-6 rounded-xl bg-slate-800/50 border border-cyan-500/30">
                  <div className="text-2xl font-bold text-cyan-400 mb-3">1. Gewebe-Release</div>
                  <p className="text-sm font-semibold text-cyan-300 mb-2">(Hardware)</p>
                  <p className="text-sm">
                    Nutze gezielten mechanischen Druck oder Massage (MFR), um strukturelle 
                    Verklebungen in den Funktionsketten vorzubereiten.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400 mb-3">2. Neuronaler Reset</div>
                  <p className="text-sm font-semibold text-purple-300 mb-2">(Software)</p>
                  <p className="text-sm">
                    Nutze AXON Neuro-Drills (z.B. für visuelle oder vestibuläre Reize), 
                    um deinem Gehirn zu signalisieren, dass die neue Freiheit sicher ist.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-slate-800/50 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400 mb-3">3. Integration</div>
                  <p className="text-sm font-semibold text-green-300 mb-2">(Speichern)</p>
                  <p className="text-sm">
                    Speichere die gewonnene Beweglichkeit durch aktive Kontrolle dauerhaft ab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Der "Aha-Moment": Kiefer-Becken-Beispiel */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-6 text-white">
            Der „Aha-Moment": Das Kiefer-Becken-Beispiel
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12 max-w-3xl mx-auto">
            Ein typischer Zusammenhang: Deine Hüfte ist fest. Du bearbeitest deine Oberschenkel mit der Rolle, 
            aber der Effekt verpufft sofort.
          </p>

          <div className="glass rounded-2xl border border-cyan-500/30 p-8 neuro-glow">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">Die AXON-Lösung:</h3>
            <div className="space-y-4 text-lg text-slate-300 leading-relaxed">
              <p>
                AXON zeigt dir die Verbindung zwischen deinem <span className="text-cyan-400 font-semibold">Kiefer</span> und 
                deiner <span className="text-purple-400 font-semibold">Beckenstabilität</span>.
              </p>
              <p>
                Durch das Lösen der Kieferspannung (Software-Reset) „erlaubt" dein Gehirn der Hüfte plötzlich, sich zu öffnen.
              </p>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/20 mt-6">
                <p className="text-center text-xl font-semibold text-cyan-400">
                  Die Mechanik bereitet vor – die Neurologie gibt die Bewegung frei.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vergleich: Klassisch vs. AXON */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Der Vergleich: Klassisch vs. AXON
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Klassisch */}
            <div className="glass rounded-2xl border border-slate-600/30 p-8">
              <div className="text-sm font-bold text-slate-500 mb-3">KLASSISCHER ANSATZ</div>
              <h3 className="text-xl font-bold text-slate-300 mb-4">
                „Es zwickt? Bearbeite das Symptom lokal und hoffe, dass es wegbleibt."
              </h3>
              <div className="space-y-3 text-slate-400">
                <p className="text-red-400 font-semibold">➔ Ignoriert die Steuerungsebene des Gehirns</p>
                <p>➔ Kurzfristige Linderung</p>
                <p>➔ Symptome kehren zurück</p>
                <p className="text-sm italic">Problem wird nur oberflächlich behandelt</p>
              </div>
            </div>

            {/* AXON */}
            <div className="glass rounded-2xl border border-cyan-500/30 p-8 neuro-glow">
              <div className="text-sm font-bold text-cyan-400 mb-3">DER AXON-WEG</div>
              <h3 className="text-xl font-bold text-white mb-4">
                „Analysiere die gesamte Funktionskette und gib dem Gehirn ein Sicherheitssignal."
              </h3>
              <div className="space-y-3 text-slate-300">
                <p className="text-green-400 font-semibold">➔ Nachhaltige Lösung durch Korrektur von Input und Output</p>
                <p>➔ Ursachen werden systematisch behoben</p>
                <p>➔ Langfristige Freiheit statt Symptombekämpfung</p>
                <p className="text-sm italic text-cyan-400">Das Problem wird an der Wurzel gelöst</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Der AXON-Weg
            </span>
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Drei Säulen für sofortige Ergebnisse
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl border border-cyan-500/20 p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-6 neuro-glow">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Focus: 40% */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass rounded-3xl border border-purple-500/30 p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Kraft braucht Sicherheit
              </span>
            </h2>
            <p className="text-lg text-slate-300 text-center max-w-3xl mx-auto mb-8">
              Wahre Kraft entsteht nicht durch den Kampf gegen Widerstände, sondern durch deren Beseitigung. 
              AXON begleitet dich durch 12 athletische Meilensteine. 
              <span className="text-purple-400 font-semibold"> Wir trainieren nicht gegen die Schutzbremse deines Körpers – wir schalten sie methodisch aus.</span>
            </p>
            <p className="text-lg text-slate-300 text-center max-w-3xl mx-auto mb-12">
              Wenn dein System weiß, dass die Endposition sicher ist, gibt es die Kraft frei, die du längst besitzt.
            </p>

            {/* Master-12 Goals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {masterGoals.map((goal, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center text-lg font-semibold text-white hover:scale-105 transition-transform"
                >
                  {goal}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-6 text-white">
            Vom Frust zur Freiheit
          </h2>
          <div className="glass rounded-2xl border border-cyan-500/20 p-8">
            <p className="text-lg text-slate-300 leading-relaxed text-center">
              Ich habe AXON entwickelt, weil ich es satt hatte, gegen meinen eigenen Körper zu kämpfen. 
              AXON ist kein Workout-Tracker. Es ist dein persönliches Diagnose-Tool, um die Sprache 
              deines Nervensystems zu verstehen. <span className="text-cyan-400 font-semibold">Werde dein eigener Therapeut.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Einmal investieren. Ein Leben lang bewegen.
            </span>
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Keine Abos. Keine versteckten Kosten. Dein Werkzeug fürs Leben.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl border border-cyan-500/30 p-12 relative overflow-hidden"
          >
            {/* Popular Badge */}
            <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold">
              🔥 Beliebt
            </div>

            <h3 className="text-3xl font-bold text-white mb-2">AXON Lifetime Access</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                59€
              </span>
              <span className="text-xl text-slate-400">einmalig</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-300">Vollständige interaktive Body-Map</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-300">Analyse aller 6 Haupt-Faszienketten</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-300">Die „Master-12" Performance-Pfade (Level 1-5)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-300">Keine Abos. Keine versteckten Kosten.</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full text-lg py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              <Zap className="w-5 h-5 mr-2" />
              JETZT FREISCHALTEN
            </Button>

            <p className="text-center text-slate-500 text-sm mt-4">
              Sichere Zahlung via Stripe • Sofortiger Zugang
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Häufige Fragen
          </h2>

          <div className="space-y-4">
            <div className="glass rounded-2xl border border-cyan-500/20 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-3">
                Das Web-App Prinzip
              </h3>
              <p className="text-slate-300 leading-relaxed">
                AXON ist eine moderne Web-App. Das bedeutet für dich: Kein Download-Stress, keine Store-Updates. 
                Einfach im Browser öffnen, zum Home-Bildschirm hinzufügen und auf jedem Gerät sofort einsatzbereit sein. 
                Deine Daten, dein Tool, dein Fortschritt.
              </p>
            </div>

            <div className="glass rounded-2xl border border-cyan-500/20 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-3">
                Brauche ich Vorkenntnisse?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Nein. AXON erklärt jeden Drill Schritt für Schritt. Egal ob du Anfänger bist 
                oder bereits trainierst – das System passt sich deinem Level an.
              </p>
            </div>

            <div className="glass rounded-2xl border border-cyan-500/20 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-3">
                Was ist, wenn es nicht funktioniert?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                AXON basiert auf wissenschaftlich fundierten Prinzipien der Neuroathletik und 
                faszialen Anatomie. Die meisten User spüren bereits nach dem ersten Drill eine 
                Verbesserung. Bei Fragen steht dir unser Support zur Seite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Factor Footer */}
      <section className="py-12 border-t border-cyan-500/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">
            Entwickelt von Athleten für Athleten
          </p>
          <p className="text-sm text-slate-500">
            Basierend auf wissenschaftlich fundierten Prinzipien der Neuroathletik und faszialen Bewegungsforschung
          </p>
        </div>
      </section>
    </div>
  );
}