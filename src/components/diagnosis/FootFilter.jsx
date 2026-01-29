import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FootFilter({ onComplete, onSkip }) {
  const [standingPain, setStandingPain] = useState(null);
  const [toeIsolation, setToeIsolation] = useState(null);
  const [sensorik, setSensorik] = useState(null);
  const [showDrill, setShowDrill] = useState(false);

  const handleStandingResponse = (answer) => {
    setStandingPain(answer);
    if (!answer) {
      // Nicht im Stehen -> Skip Foot-Check
      onSkip();
    }
  };

  const handleTestComplete = () => {
    const footIssueDetected = toeIsolation === 'difficult' || sensorik === 'uneven';
    
    if (footIssueDetected && !showDrill) {
      setShowDrill(true);
    } else {
      onComplete({
        foot_check_performed: true,
        toe_isolation: toeIsolation,
        sensorik: sensorik,
        foot_issue_detected: footIssueDetected,
        drill_recommended: footIssueDetected
      });
    }
  };

  const handleContinue = () => {
    onComplete({
      foot_check_performed: true,
      toe_isolation: toeIsolation,
      sensorik: sensorik,
      foot_issue_detected: true,
      drill_completed: true
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-cyan rounded-2xl p-6 border border-cyan-500/30"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center neuro-glow">
            <Footprints className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-cyan-400">Basisfundament: Fuß-Check</h3>
            <p className="text-xs text-slate-400">Root-Cause Analyse für Steh-Symptome</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Viele Symptome im Stehen haben ihre Ursache in eingeschränkter Fuß-Sensorik. 
          Lass uns das kurz überprüfen.
        </p>
      </motion.div>

      {/* Step 1: Standing Pain Question */}
      {standingPain === null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <h4 className="text-base sm:text-lg font-semibold text-cyan-400 mb-4">
            Tritt dein Schmerz primär im Stehen oder Gehen auf?
          </h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            <Button
              onClick={() => handleStandingResponse(true)}
              className="h-auto min-h-[64px] sm:h-20 py-3 px-4 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-2 border-cyan-500/30 hover:border-cyan-500 text-cyan-400 font-semibold text-sm sm:text-base whitespace-normal leading-tight"
            >
              Ja, primär im Stehen/Gehen
            </Button>
            <Button
              onClick={() => handleStandingResponse(false)}
              variant="outline"
              className="h-auto min-h-[64px] sm:h-20 py-3 px-4 border-slate-600 hover:border-slate-500 text-slate-400 text-sm sm:text-base whitespace-normal leading-tight"
            >
              Nein, auch im Liegen/Sitzen
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Foot Tests */}
      {standingPain === true && !showDrill && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Toe Isolation Test */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-200 mb-2">Großzehen-Check</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Kannst du deinen großen Zeh isoliert ca. 30 Grad anheben, ohne dass der Fuß einknickt oder die kleinen Zehen mitgehen?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setToeIsolation('easy')}
                    variant={toeIsolation === 'easy' ? 'default' : 'outline'}
                    className={toeIsolation === 'easy' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Klar & einfach
                  </Button>
                  <Button
                    onClick={() => setToeIsolation('difficult')}
                    variant={toeIsolation === 'difficult' ? 'default' : 'outline'}
                    className={toeIsolation === 'difficult' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Schwierig/unklar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sensory Test */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-200 mb-2">Sensorik-Check</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Fühlt sich der Bodenkontakt unter beiden Füßen gleichmäßig und 'scharf' an, oder wirkt eine Seite 'taub' oder diffus?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setSensorik('even')}
                    variant={sensorik === 'even' ? 'default' : 'outline'}
                    className={sensorik === 'even' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Gleichmäßig & scharf
                  </Button>
                  <Button
                    onClick={() => setSensorik('uneven')}
                    variant={sensorik === 'uneven' ? 'default' : 'outline'}
                    className={sensorik === 'uneven' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Ungleich/taub
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          {toeIsolation && sensorik && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleTestComplete}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12 font-semibold neuro-glow"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Step 3: Instant Drill */}
      {showDrill && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="glass-purple rounded-2xl p-6 border border-purple-500/30">
            <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <Footprints className="w-5 h-5" />
              Sofort-Drill: Fußsohlen-Mobilisation
            </h4>
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Deine Fußsensorik scheint eingeschränkt zu sein. Das kann ein limitierender Faktor für die betroffene Faszialkette sein.
              </p>
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <p className="text-sm font-semibold text-purple-400 mb-2">Anleitung:</p>
                <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Reibe deine Fußsohle kräftig für 20-30 Sekunden über einen harten Gegenstand (Tennisball, Igelball, oder eine Flasche)</li>
                  <li>Fokussiere dabei auf die Fußwurzel und den Großzehenballen</li>
                  <li>Wiederhole auf der anderen Seite</li>
                  <li>Teste danach erneut die Großzehen-Ansteuerung</li>
                </ol>
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                <p className="text-xs text-cyan-400 font-semibold mb-1">🧠 Neurologischer Hintergrund:</p>
                <p className="text-xs text-slate-400">
                  Propriozeptives System-Schärfung. Die Fußsohle hat die höchste Rezeptoren-Dichte im Körper. 
                  Durch die Stimulation verbesserst du das neuronale Signal zum Gehirn.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12 font-semibold neuro-glow"
          >
            Drill durchgeführt – Weiter zu den Tests
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}