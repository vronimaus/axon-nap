import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronRight, ExternalLink } from 'lucide-react';

const RED_FLAGS = [
  {
    id: 'trauma',
    question: 'Hattest du kürzlich einen Unfall oder ein Trauma (Sturz, Aufprall)?',
    warning: 'Bei akuten Verletzungen sollte eine medizinische Abklärung erfolgen.'
  },
  {
    id: 'numbness',
    question: 'Hast du Taubheitsgefühle, Kribbeln oder Lähmungserscheinungen?',
    warning: 'Neurologische Symptome erfordern eine ärztliche Untersuchung.'
  },
  {
    id: 'fever',
    question: 'Hast du Fieber, Nachtschweiß oder unerklärlichen Gewichtsverlust?',
    warning: 'Systemische Symptome müssen medizinisch abgeklärt werden.'
  },
  {
    id: 'chest',
    question: 'Hast du Brustschmerzen, Atemnot oder Herzrasen?',
    warning: 'Kardiovaskuläre Symptome erfordern sofortige medizinische Hilfe.'
  },
  {
    id: 'severe',
    question: 'Ist der Schmerz so stark, dass du normale Aktivitäten nicht ausführen kannst?',
    warning: 'Starke, unkontrollierbare Schmerzen sollten ärztlich untersucht werden.'
  },
  {
    id: 'worsening',
    question: 'Verschlimmern sich deine Symptome trotz Ruhe kontinuierlich?',
    warning: 'Progressive Verschlechterung erfordert eine medizinische Bewertung.'
  }
];

export default function RedFlagScreen({ onContinue }) {
  const [answers, setAnswers] = useState({});

  const handleAnswer = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const hasRedFlags = Object.values(answers).some(v => v === true);
  const allAnswered = Object.keys(answers).length === RED_FLAGS.length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            System-Check & Sicherheit
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            AXON ist für die Optimierung deines Nervensystems und deiner Bewegungsmuster gedacht. 
            Bitte bestätige, dass <span className="text-red-400 font-semibold">KEINES</span> der folgenden Symptome vorliegt:
          </p>
        </div>

        {/* Questions */}
        <div className="glass rounded-2xl border border-cyan-500/20 p-8 space-y-6">
          {RED_FLAGS.map((flag, idx) => (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-3"
            >
              <p className="text-slate-300 font-medium">
                {idx + 1}. {flag.question}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAnswer(flag.id, true)}
                  variant={answers[flag.id] === true ? 'default' : 'outline'}
                  className={answers[flag.id] === true ? 'bg-red-500 hover:bg-red-600' : 'border-slate-600 hover:bg-slate-800'}
                >
                  Ja
                </Button>
                <Button
                  onClick={() => handleAnswer(flag.id, false)}
                  variant={answers[flag.id] === false ? 'default' : 'outline'}
                  className={answers[flag.id] === false ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-slate-600 hover:bg-slate-800'}
                >
                  Nein
                </Button>
              </div>
              {answers[flag.id] === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400"
                >
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  {flag.warning}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Warning Message or Continue Button */}
        <AnimatePresence>
          {allAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {hasRedFlags ? (
                <div className="glass rounded-2xl border border-red-500/30 p-8 text-center">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Bitte konsultiere einen Arzt
                  </h3>
                  <p className="text-slate-300 mb-6 max-w-lg mx-auto">
                    Aufgrund deiner Angaben empfehlen wir dir, deine Symptome ärztlich 
                    abklären zu lassen, bevor du mit AXON arbeitest.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => window.open('https://www.116117.de', '_blank')}
                      className="bg-red-500 hover:bg-red-600 gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Arztsuche (116117)
                    </Button>
                    <Button
                      onClick={() => setAnswers({})}
                      variant="outline"
                      className="border-slate-600"
                    >
                      Antworten zurücksetzen
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={onContinue}
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-lg gap-2"
                >
                  AXON Detective starten
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          AXON ersetzt keine medizinische Diagnose oder Behandlung. 
          Bei Unsicherheit konsultiere immer einen qualifizierten Arzt oder Therapeuten.
        </p>
      </motion.div>
    </div>
  );
}