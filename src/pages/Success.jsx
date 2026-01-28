import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Success() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl border border-cyan-500/30 p-12 max-w-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Willkommen bei AXON!
        </h1>
        
        <p className="text-xl text-slate-300 mb-8">
          Deine Zahlung war erfolgreich. Du hast jetzt lebenslangen Zugang zur AXON Web-App.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-cyan-500/20">
          <p className="text-slate-300 mb-4">
            Starte jetzt mit deiner ersten Analyse und entdecke, wie du deine Bewegungsfreiheit zurückgewinnst.
          </p>
        </div>

        <Link to={createPageUrl('Dashboard')}>
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
          >
            <Zap className="w-5 h-5 mr-2" />
            Zum Command Center
          </Button>
        </Link>

        <p className="text-sm text-slate-500 mt-6">
          Eine Bestätigungs-E-Mail ist unterwegs zu dir.
        </p>
      </motion.div>
    </div>
  );
}