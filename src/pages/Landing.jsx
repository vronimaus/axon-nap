import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, MapPin, Brain, Target, Shield, ChevronDown } from 'lucide-react';
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
              Dein Körper hat ein Betriebssystem.
            </span>
            <br />
            <span className="text-white">
              Wir geben dir den Zugangscode.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Vergiss langes Warten auf Termine. Nutze die visuelle Body-Map und neuronale Drills, 
            um Schmerzen in Sekunden zu lösen und deine Performance-Ziele zu knacken.
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

      {/* Problem Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="glass rounded-3xl border border-red-500/30 p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">
              Die Therapie-Lücke 🔴
            </h2>
            <div className="space-y-4 text-lg text-slate-300 leading-relaxed">
              <p>
                Du bist nicht verletzt, aber dein Körper fühlt sich 'blockiert' an? 
                Dein Physio hat erst in drei Wochen Zeit und Youtube-Videos sind zu allgemein?
              </p>
              <p>
                Die meisten Trainingsprogramme ignorieren das Gehirn – dabei ist es die 
                Schaltzentrale für jeden Schmerz und jede Bewegung.
              </p>
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30">
                <p className="text-xl font-bold text-cyan-400 text-center">
                  ⚡ Dein Schmerz ist kein Hardware-Fehler.<br />
                  Er ist ein Software-Schutzsignal.
                </p>
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

      {/* Master-12 Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass rounded-3xl border border-purple-500/30 p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Die Master-12
              </span>
            </h2>
            <p className="text-xl text-slate-300 text-center mb-4">
              Werde zum Architekten deiner Bewegung
            </p>
            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-12">
              AXON begleitet dich bei den 12 wichtigsten Meilensteinen der Athletik – 
              vom perfekten Pistol Squat bis zur Brücke. Mit dem 5-Level-System schaltet 
              dein Gehirn neue Bewegungsspielräume erst frei, wenn es sich sicher fühlt.
            </p>

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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Lifetime Access
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
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-300">{benefit}</span>
                </div>
              ))}
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
                Muss ich AXON im App Store laden?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Nein. AXON ist eine moderne Web-App (PWA). Du öffnest sie einfach im Browser, 
                fügst sie mit einem Klick zu deinem Home-Bildschirm hinzu und sie funktioniert 
                wie eine normale App – ohne den Stress mit Store-Updates oder Datenschutz-Dschungeln.
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
            Basierend auf den Prinzipien der Neuroathletik und den Anatomy Trains nach Tom Myers
          </p>
        </div>
      </section>
    </div>
  );
}