import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Wrench, Brain, Dumbbell, Info } from 'lucide-react';

export default function ExerciseActionCard({ 
  phases,
  onComplete
}) {
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedInfo, setExpandedInfo] = useState(null);

  const phaseIcons = {
    hardware: Wrench,
    software: Brain,
    integration: Dumbbell
  };

  const phaseColors = {
    hardware: { bg: 'from-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    software: { bg: 'from-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    integration: { bg: 'from-green-500/20', border: 'border-green-500/30', text: 'text-green-400' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <h2 className="text-xl font-bold text-amber-400 mb-4">Deine Performance-Übungen</h2>
      
      {phases.map((phase, idx) => {
        const Icon = phaseIcons[phase.type] || Dumbbell;
        const colors = phaseColors[phase.type] || phaseColors.integration;
        const isExpanded = expandedPhase === idx;

        return (
          <div
            key={idx}
            className={`glass rounded-xl border ${colors.border} bg-gradient-to-r ${colors.bg} to-transparent overflow-hidden`}
          >
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : idx)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${colors.text}`}>{phase.title}</h3>
                  <p className="text-xs text-slate-400">{phase.duration || '10-15 Min'}</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-700/50"
                >
                  <div className="p-4 space-y-3">
                    {phase.exercises?.map((ex, exIdx) => {
                      const infoKey = `${idx}-${exIdx}`;
                      const showInfo = expandedInfo === infoKey;
                      
                      return (
                        <div key={exIdx} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-100 text-base">{ex.name}</p>
                              {ex.sets_reps && (
                                <p className="text-sm text-amber-400 font-medium mt-1">{ex.sets_reps}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setExpandedInfo(showInfo ? null : infoKey)}
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
                              title="Mehr Infos"
                            >
                              <Info className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <div className="text-sm text-slate-300 leading-relaxed">
                              {ex.instruction}
                            </div>
                            
                            <AnimatePresence>
                              {showInfo && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                                    <p className="text-xs font-semibold text-amber-400 mb-2">💡 Hintergrund</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                      {getExerciseBackground(ex.name, phase.type)}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {onComplete && (
        <Button
          onClick={onComplete}
          className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold mt-6"
        >
          Fertig - Session abschließen
        </Button>
      )}
    </motion.div>
  );
}

// Helper function to generate contextual background info
function getExerciseBackground(exerciseName, phaseType) {
  const name = exerciseName.toLowerCase();
  
  // Hardware (Mobilität) backgrounds
  if (phaseType === 'hardware') {
    if (name.includes('schulter')) {
      return 'Die Schulter ist das mobilste Gelenk des Körpers. Nach Luigi Stecco (Faszien-Experte) müssen wir die faszialen Ketten um die Schulter lösen, um volle Beweglichkeit zu erreichen. Diese Übung adressiert die myofaszialen Verbindungen.';
    }
    if (name.includes('thorax') || name.includes('brust')) {
      return 'Der Thorax (Brustkorb) ist zentral für Atmung und Schulterfunktion. Gray Cook (FMS-Entwickler) betont: "Stabilität vor Mobilität" - aber hier brauchen wir Mobilität als Basis für spätere Integration.';
    }
    if (name.includes('lat') || name.includes('rücken')) {
      return 'Der Latissimus ist die größte Rückenfläche. Pavel Tsatsouline (Kettlebell-Ikone) sagt: "Lat-Spannung ist Ganzkörper-Spannung." Wir dehnen ihn hier, um später maximale Kraft zu entwickeln.';
    }
  }
  
  // Software (Neuro) backgrounds
  if (phaseType === 'software') {
    if (name.includes('schulterblatt') || name.includes('scapula')) {
      return 'Das Schulterblatt muss sich frei auf dem Brustkorb bewegen können. McGill (Wirbelsäulen-Forscher) zeigt: Schulterstabilität = Wirbelsäulenschutz. Wir aktivieren hier die neuronale Kontrolle.';
    }
    if (name.includes('lat')) {
      return 'Lat-Aktivierung ist neurologisch zentral. Dan John (Strength Coach) lehrt: "Der Lat verbindet Hüfte mit Schulter." Ohne bewusste Aktivierung bleibt Kraft ungenutzt.';
    }
  }
  
  // Integration (Kraft) backgrounds
  if (phaseType === 'integration') {
    if (name.includes('negativ') || name.includes('absenken')) {
      return 'Negative (exzentrische) Wiederholungen bauen 1.5x mehr Kraft auf als konzentrische. Vern Gambetta (Athletic Development) nennt sie "die Geheimwaffe für Sportler."';
    }
    if (name.includes('australian')) {
      return 'Horizontales Ziehen baut Rücken-Fundament auf. Pavel empfiehlt: "Meistere die Reihe, bevor du den Klimmzug versuchst." Diese Variation ist perfekt für progressive Überlastung.';
    }
    if (name.includes('scapula')) {
      return 'Scapula Pull-ups isolieren die Schultergürtel-Retraktion - das ist die Basis aller Zugbewegungen. Gray Cook: "Corrective before Performance" - diese Übung ist beides.';
    }
  }
  
  // Fallback
  return 'Diese Übung ist wissenschaftlich fundiert und baut systematisch die Grundlage für dein athletisches Ziel auf. Jede Wiederholung zählt - Qualität vor Quantität.';
}