import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Brain, Zap, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BioSyncResultCard({ feeling, focus, energy, readinessStatus, onClose }) {
  // Determine individual statuses
  const getStatus = (value) => {
    if (value <= 4) return 'red';
    if (value <= 7) return 'yellow';
    return 'green';
  };

  const feelingStatus = getStatus(feeling);
  const focusStatus = getStatus(focus);
  const energyStatus = getStatus(energy);

  // Generate detailed analysis texts
  const getAnalysisText = (type, value, status) => {
    const analyses = {
      feeling: {
        red: 'Erhöhte Grundspannung in den Ketten festgestellt.',
        yellow: 'Leichte Steifigkeit vorhanden – Gewebe braucht Vorbereitung.',
        green: 'Optimaler Gewebezustand – volle Bewegungsfreiheit.'
      },
      focus: {
        red: 'Visuelle Ermüdung erkannt – ZNS braucht Reset.',
        yellow: 'Mentale Ermüdung vorhanden – reduzierte Komplexität empfohlen.',
        green: 'Fokus optimal – bereit für komplexe Koordination.'
      },
      energy: {
        red: 'Niedriges Energie-Level – Recovery-Fokus notwendig.',
        yellow: 'Moderate Kapazität – angepasstes Volumen empfohlen.',
        green: 'Energie-Level stabil für volle Belastung.'
      }
    };
    return analyses[type][status];
  };

  // Generate action plan based on combination
  const getActionPlan = () => {
    const actions = [];

    // Feeling/Hardware adjustments
    if (feelingStatus === 'red') {
      actions.push({
        icon: Wrench,
        text: '+ 2 Min. MFR-Resets am Anfang zur Spannungsreduktion',
        type: 'add'
      });
      actions.push({
        icon: AlertTriangle,
        text: 'Explosive Sprünge werden gestrichen – Fokus auf Gelenkreichweite',
        type: 'warning'
      });
    } else if (feelingStatus === 'yellow') {
      actions.push({
        icon: Wrench,
        text: '+ 1 Min. sanftes MFR-Reset zur Vorbereitung',
        type: 'add'
      });
    }

    // Focus/Software adjustments
    if (focusStatus === 'red') {
      actions.push({
        icon: Brain,
        text: '+ 90 Sek. Neuro-Beruhigung (Augen-Entspannung/Palmieren)',
        type: 'add'
      });
      actions.push({
        icon: AlertTriangle,
        text: 'Koordinative Komplexität wird reduziert',
        type: 'warning'
      });
    } else if (focusStatus === 'yellow') {
      actions.push({
        icon: Brain,
        text: 'Fokus auf präzise, langsame Bewegungen statt Tempo',
        type: 'adjust'
      });
    } else if (focusStatus === 'green' && feelingStatus === 'green' && energyStatus === 'green') {
      actions.push({
        icon: Zap,
        text: 'Boost-Modus aktiviert: Komplexe Koordinations-Drills erlaubt',
        type: 'boost'
      });
    }

    // Energy/Battery adjustments
    if (energyStatus === 'red') {
      actions.push({
        icon: XCircle,
        text: 'Volumen wird um 30% reduziert – Pausenzeiten erhöht',
        type: 'warning'
      });
      actions.push({
        icon: Zap,
        text: 'Fokus auf "Energy In": Atem-Drills zur Regeneration',
        type: 'add'
      });
    } else if (energyStatus === 'yellow') {
      actions.push({
        icon: Zap,
        text: 'Session wird kompakt gehalten – Qualität vor Quantität',
        type: 'adjust'
      });
    } else if (energyStatus === 'green' && focusStatus === 'green' && feelingStatus === 'green') {
      actions.push({
        icon: CheckCircle2,
        text: 'Volumen kann um 20% erhöht werden – kürzere Pausen',
        type: 'boost'
      });
    }

    return actions;
  };

  // Generate expert insight
  const getExpertInsight = () => {
    if (readinessStatus === 'red') {
      return 'Dein Gehirn schaltet Kraft erst frei, wenn es sich sicher fühlt. Heute nehmen wir die neuronale Handbremse weg, damit du trotz niedriger Energie schmerzfrei bleibst und dein System regenerieren kann.';
    } else if (readinessStatus === 'yellow') {
      return 'Dein System braucht heute eine intelligente Balance. Durch gezielte Software-Updates und Hardware-Resets maximieren wir deinen Output bei minimalem Verletzungsrisiko.';
    } else {
      return 'Optimale Systemkalibrierung! Alle drei Ebenen (Gewebe, Fokus, Energie) sind synchronisiert. Dein Nervensystem ist bereit für Höchstleistungen.';
    }
  };

  const actionPlan = getActionPlan();

  return (
    <motion.div
      key="results"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="glass rounded-2xl border border-cyan-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      {/* Header - System Status */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
            readinessStatus === 'green' ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-400' :
            readinessStatus === 'yellow' ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-400' :
            'bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400'
          }`}
        >
          <div className={`w-16 h-16 rounded-full ${
            readinessStatus === 'green' ? 'bg-green-400' :
            readinessStatus === 'yellow' ? 'bg-amber-400' :
            'bg-red-400'
          } animate-pulse`} />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2"
        >
          SYSTEM STATUS: {
            readinessStatus === 'green' ? 'CALIBRATED' :
            readinessStatus === 'yellow' ? 'ADJUSTMENT MODE' :
            'RECOVERY MODE'
          }
        </motion.h2>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Die 3 Säulen */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Mechanik (Gewebe) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-4 rounded-xl border ${
            feelingStatus === 'green' ? 'bg-green-500/5 border-green-500/30' :
            feelingStatus === 'yellow' ? 'bg-amber-500/5 border-amber-500/30' :
            'bg-red-500/5 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Wrench className={`w-5 h-5 ${
              feelingStatus === 'green' ? 'text-green-400' :
              feelingStatus === 'yellow' ? 'text-amber-400' :
              'text-red-400'
            }`} />
            <h3 className="font-bold text-white text-sm">Mechanik (Gewebe)</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              feelingStatus === 'green' ? 'bg-green-500' :
              feelingStatus === 'yellow' ? 'bg-amber-500' :
              'bg-red-500'
            }`}>
              {feeling}
            </div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feeling * 10}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className={`h-full ${
                  feelingStatus === 'green' ? 'bg-green-500' :
                  feelingStatus === 'yellow' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {getAnalysisText('feeling', feeling, feelingStatus)}
          </p>
        </motion.div>

        {/* Steuerung (Fokus) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`p-4 rounded-xl border ${
            focusStatus === 'green' ? 'bg-green-500/5 border-green-500/30' :
            focusStatus === 'yellow' ? 'bg-amber-500/5 border-amber-500/30' :
            'bg-red-500/5 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className={`w-5 h-5 ${
              focusStatus === 'green' ? 'text-green-400' :
              focusStatus === 'yellow' ? 'text-amber-400' :
              'text-red-400'
            }`} />
            <h3 className="font-bold text-white text-sm">Steuerung (Fokus)</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              focusStatus === 'green' ? 'bg-green-500' :
              focusStatus === 'yellow' ? 'bg-amber-500' :
              'bg-red-500'
            }`}>
              {focus}
            </div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${focus * 10}%` }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className={`h-full ${
                  focusStatus === 'green' ? 'bg-green-500' :
                  focusStatus === 'yellow' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {getAnalysisText('focus', focus, focusStatus)}
          </p>
        </motion.div>

        {/* Energie (Kapazität) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-4 rounded-xl border ${
            energyStatus === 'green' ? 'bg-green-500/5 border-green-500/30' :
            energyStatus === 'yellow' ? 'bg-amber-500/5 border-amber-500/30' :
            'bg-red-500/5 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className={`w-5 h-5 ${
              energyStatus === 'green' ? 'text-green-400' :
              energyStatus === 'yellow' ? 'text-amber-400' :
              'text-red-400'
            }`} />
            <h3 className="font-bold text-white text-sm">Energie (Kapazität)</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              energyStatus === 'green' ? 'bg-green-500' :
              energyStatus === 'yellow' ? 'bg-amber-500' :
              'bg-red-500'
            }`}>
              {energy}
            </div>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${energy * 10}%` }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className={`h-full ${
                  energyStatus === 'green' ? 'bg-green-500' :
                  energyStatus === 'yellow' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {getAnalysisText('energy', energy, energyStatus)}
          </p>
        </motion.div>
      </div>

      {/* Action Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <h3 className="text-xl font-bold text-cyan-400 mb-4">AXON Anpassung für heute:</h3>
        <div className="space-y-3">
          {actionPlan.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  action.type === 'boost' ? 'bg-green-500/10 border border-green-500/30' :
                  action.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                  action.type === 'add' ? 'bg-cyan-500/10 border border-cyan-500/30' :
                  'bg-slate-800/50 border border-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  action.type === 'boost' ? 'text-green-400' :
                  action.type === 'warning' ? 'text-amber-400' :
                  action.type === 'add' ? 'text-cyan-400' :
                  'text-slate-400'
                }`} />
                <p className="text-sm text-slate-300">{action.text}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Expert Insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="glass-purple rounded-xl p-4 mb-6"
      >
        <h4 className="text-sm font-bold text-purple-400 mb-2">💡 Expert Insight</h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          {getExpertInsight()}
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <Button
          onClick={onClose}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-lg"
        >
          Session starten
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}