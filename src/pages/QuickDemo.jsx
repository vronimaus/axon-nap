import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickDemo() {
  const [step, setStep] = useState('region'); // region, test, drill, result
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [drillResult, setDrillResult] = useState(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const regions = ['Hüfte', 'Schulter', 'Rücken', 'Knie', 'Nacken'];
  
  const regionTests = {
    'Hüfte': { name: 'Beinrotation Test', description: 'Leg dein Bein an und rotiere es nach außen' },
    'Schulter': { name: 'Schulter-Flexion', description: 'Hebe deinen Arm nach vorne' },
    'Rücken': { name: 'Wirbelsäulen-Twist', description: 'Dreh deinen Oberkörper nach rechts' },
    'Knie': { name: 'Knie-Beugen Test', description: 'Mache eine flache Kniebeuge' },
    'Nacken': { name: 'Nacken-Rotation', description: 'Dreh deinen Kopf nach rechts' }
  };

  const drillResponse = {
    'Hüfte': { name: 'Kiefer-Entspannung', description: 'Lockere deinen Kiefer, deine Hüfte folgt.' },
    'Schulter': { name: 'Atemdrille', description: 'Tiefe Bauchatmung entspannt deine Schulter.' },
    'Rücken': { name: 'Visueller Fix', description: 'Folge mit deinen Augen einer imaginären Linie.' },
    'Knie': { name: 'Balance-Drill', description: 'Steh auf einem Bein und finde dein Gleichgewicht.' },
    'Nacken': { name: 'Vestibulär-Reset', description: 'Drehe deinen Kopf langsam im Kreis.' }
  };

  const handleTestComplete = () => {
    setTestResult({ success: Math.random() > 0.5 });
    setStep('drill');
  };

  const handleDrillComplete = () => {
    setDrillResult({ improvement: Math.random() > 0.4 });
    setStep('result');
  };

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      toast.error('Checkout funktioniert nur in der veröffentlichten App.');
      return;
    }
    
    setIsCheckoutLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCheckout');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Checkout-Fehler. Bitte versuche es erneut.');
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" />
            Quick Demo – 5 Min AHA!
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Finde dein Problem</h1>
          <p className="text-slate-400">Wir zeigen dir in 5 Minuten, wie AXON funktioniert.</p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* Step 1: Region Selection */}
          {step === 'region' && (
            <motion.div
              key="region"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p className="text-xl text-slate-300 text-center">Wo zwickt es dich?</p>
              <div className="grid grid-cols-2 gap-4">
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => {
                      setSelectedRegion(region);
                      setStep('test');
                    }}
                    className="p-4 rounded-xl border border-cyan-500/30 bg-slate-800/50 text-white hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all font-semibold"
                  >
                    {region}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Hardware Test */}
          {step === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-cyan-500/20 p-8">
                <div className="text-sm text-cyan-400 font-semibold mb-2">Test für {selectedRegion}</div>
                <h2 className="text-2xl font-bold text-white mb-4">{regionTests[selectedRegion].name}</h2>
                <p className="text-slate-300 text-lg mb-6">{regionTests[selectedRegion].description}</p>
                <p className="text-sm text-slate-400">Mache den Test und sag uns Bescheid, wenn du es getan hast.</p>
              </div>
              <Button
                onClick={handleTestComplete}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white neuro-glow"
              >
                Test erledigt <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Neuro Drill */}
          {step === 'drill' && (
            <motion.div
              key="drill"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-purple-500/20 p-8">
                <div className="text-sm text-purple-400 font-semibold mb-2">Neuro-Drill</div>
                <h2 className="text-2xl font-bold text-white mb-4">{drillResponse[selectedRegion].name}</h2>
                <p className="text-slate-300 text-lg mb-6">{drillResponse[selectedRegion].description}</p>
                <p className="text-sm text-slate-400">Probiere den Drill aus. Wie fühlt sich deine {selectedRegion} jetzt an?</p>
              </div>
              <Button
                onClick={handleDrillComplete}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white neuro-glow"
              >
                Drill erledigt <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 4: Results & CTA */}
          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="glass rounded-2xl border border-green-500/20 p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">AHA-Moment!</h2>
                <p className="text-slate-300 text-lg mb-6">
                  {drillResult?.improvement
                    ? 'Du merkst schon eine Verbesserung, oder? Das ist erst der Anfang!'
                    : 'Keine Verbesserung? Kein Problem – wir haben 50+ weitere Drills!'}
                </p>
              </div>

              <div className="glass rounded-2xl border border-cyan-500/20 p-8">
                <h3 className="text-xl font-bold text-white mb-4">Was du nach dem Kauf bekommst:</h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span>50+ spezialisierte Neuro-Drills</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span>Analyse aller 12 Faszialketten</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span>Lifetime-Zugang für nur €59</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
                size="lg"
                className="w-full text-lg py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white neuro-glow disabled:opacity-50"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isCheckoutLoading ? 'Lädt...' : 'JETZT FREISCHALTEN – €59'}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}