import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function Success() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const features = [
    { title: 'Visuelle Diagnose', desc: 'Markiere deinen Schmerz auf einer interaktiven 3D Body-Map' },
    { title: 'Neuro-Analyse', desc: 'AXON identifiziert die zugrundeliegenden Faszien- und Nervenbahnen' },
    { title: 'Spezifische Drills', desc: 'Erhalte präzise Übungen zur Aktivierung deines Nervensystems' },
    { title: '12 Performance-Ziele', desc: 'Von Pistol Squat bis Handstand – systematisch aufgebaut' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-20">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Du bist dabei! 🎯
          </h1>
          
          <p className="text-2xl text-cyan-400 mb-3 font-semibold">
            Zahlung erfolgreich
          </p>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Du hast jetzt lebenslangen Zugang zu AXON – keine Abos, keine versteckten Kosten.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 mb-16"
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="glass rounded-2xl border border-cyan-500/20 p-6 hover:border-cyan-500/50 transition-all"
            >
              <h3 className="text-xl font-bold text-cyan-400 mb-2">{feature.title}</h3>
              <p className="text-slate-300">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl border border-cyan-500/30 p-12 text-center neuro-glow"
        >
          <div className="bg-slate-800/50 rounded-xl p-8 mb-8 border border-cyan-500/20">
            <p className="text-lg text-slate-300 leading-relaxed mb-4">
              Starte jetzt deine erste Analyse. Zeichne deinen Schmerz auf die Body-Map, lass AXON dein Nervensystem analysieren und erhalte sofort spezifische Drills zur Aktivierung.
            </p>
            <p className="text-cyan-400 font-semibold">
              Viele User berichten von spürbaren Verbesserungen bereits nach dem ersten Drill.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            size="lg"
            className="w-full text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow mb-4"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoggingIn ? 'Leite weiter...' : 'Jetzt AXON öffnen'}
          </Button>

          <p className="text-sm text-slate-400">
            Eine Bestätigungs-E-Mail ist auf dem Weg zu dir.
          </p>
        </motion.div>
      </div>
    </div>
  );
}