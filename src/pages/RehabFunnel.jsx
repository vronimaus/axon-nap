import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Lock, CheckCircle2, Zap, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import InteractiveBodyMapInput from '@/components/diagnosis/InteractiveBodyMapInput';
import RehabFunnelExerciseCard from '@/components/rehab/RehabFunnelExerciseCard';

// Step indicators
const STEPS = ['body', 'questions', 'loading', 'preview'];

export default function RehabFunnel() {
  const [step, setStep] = useState('body'); // body | questions | loading | preview
  const [region, setRegion] = useState('');
  const [painIntensity, setPainIntensity] = useState(5);
  const [duration, setDuration] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const handleBodyMapSubmit = (mapData) => {
    setRegion(mapData.region);
    setStep('questions');
  };

  const handleGeneratePlan = async () => {
    setStep('loading');
    setError('');
    try {
      const res = await base44.functions.invoke('generateRehabPlanPublic', {
        region,
        pain_intensity: painIntensity,
        duration,
        activity_level: activityLevel
      });
      if (res.data?.success && res.data?.plan) {
        // Store in sessionStorage for post-login persistence
        sessionStorage.setItem('axon_pending_rehab_plan', JSON.stringify(res.data.plan));
        setPlan(res.data.plan);
        setStep('preview');
      } else {
        setError('Plan konnte nicht erstellt werden. Bitte versuche es erneut.');
        setStep('questions');
      }
    } catch (e) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setStep('questions');
    }
  };

  const handleUnlock = () => {
    // Track intent
    base44.analytics.track({ eventName: 'rehab_funnel_unlock_clicked', properties: { region } });
    // Store mode & pending plan so Layout.js knows to redirect to checkout after login
    localStorage.setItem('axon_selected_mode', 'direct');
    if (plan) {
      sessionStorage.setItem('axon_pending_rehab_plan', JSON.stringify(plan));
    }
    // Redirect to login – after login, Layout.js will handle checkout redirect
    base44.auth.redirectToLogin(createPageUrl('RehabPlan'));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
            alt="AXON"
            className="h-8 object-contain"
          />
          {step !== 'body' && (
            <span className="text-xs text-slate-400 uppercase tracking-widest ml-auto">
              {step === 'questions' ? 'Schritt 2/3' : step === 'loading' ? 'Erstelle Plan...' : 'Dein Plan'}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* STEP 1: Body Map */}
          {step === 'body' && (
            <motion.div
              key="body"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black tracking-tight">
                  Wo hast du <span className="text-cyan-400">Beschwerden?</span>
                </h1>
                <p className="text-slate-400 text-sm">
                  Tippe auf die Körperstelle – wir erstellen deinen persönlichen Rehab-Plan.
                </p>
              </div>
              <InteractiveBodyMapInput onSubmit={handleBodyMapSubmit} />
            </motion.div>
          )}

          {/* STEP 2: Questions */}
          {step === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 text-xs text-cyan-400 font-medium">
                  {region}
                </div>
                <h2 className="text-xl font-bold mt-3">Noch 2 kurze Fragen</h2>
                <p className="text-slate-400 text-sm">Damit dein Plan wirklich zu dir passt.</p>
              </div>

              {/* Pain intensity */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">
                  Wie stark sind die Beschwerden? <span className="text-cyan-400">{painIntensity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={painIntensity}
                  onChange={(e) => setPainIntensity(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Leicht (1)</span>
                  <span>Unerträglich (10)</span>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">Wie lange hast du diese Beschwerden?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Seit wenigen Tagen', 'Seit Wochen', 'Seit Monaten', 'Seit Jahren'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDuration(opt)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                        duration === opt
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300">Wie aktiv bist du?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'sedentary', label: 'Wenig aktiv' },
                    { value: 'lightly_active', label: 'Etwas aktiv' },
                    { value: 'moderately_active', label: 'Regelmäßig aktiv' },
                    { value: 'very_active', label: 'Sehr aktiv' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setActivityLevel(opt.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                        activityLevel === opt.value
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleGeneratePlan}
                disabled={!duration || !activityLevel}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-base py-6 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                Meinen Rehab-Plan erstellen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-xs text-slate-500">Kostenlos & ohne Registrierung</p>
            </motion.div>
          )}

          {/* STEP 3: Loading */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 border-transparent animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">AXON analysiert deine Beschwerden</h2>
                <p className="text-slate-400 text-sm">Dein personalisierter Rehab-Plan wird erstellt...</p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {['Schmerzregion analysiert ✓', 'Fasziale Ketten berechnet...', 'Übungen personalisiert...'].map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.8 }}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Plan Preview */}
          {step === 'preview' && plan && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Success header */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-black">Dein Plan ist fertig!</h2>
                <p className="text-slate-400 text-sm">{plan.problem_summary}</p>
              </div>

              {/* Phase overview */}
              <div className="space-y-3">
                {plan.phases.map((phase) => (
                  <div
                    key={phase.phase_number}
                    className="rounded-2xl border bg-slate-900/80 border-slate-700 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                        Phase {phase.phase_number}
                      </span>
                      <span className="text-xs text-slate-500">{phase.duration_days} Tage</span>
                    </div>
                    <h3 className="font-bold text-white">{phase.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{phase.description}</p>
                    <div className="mt-3 space-y-1">
                      {(phase.exercises || []).map((ex, i) => {
                        // Group by category/section
                        const isFirstInCategory = !phase.exercises.slice(0, i).some(e => e.category === ex.category);
                        return (
                          <div key={i} className={`flex items-center gap-2 text-xs ${isFirstInCategory ? 'text-slate-300' : 'text-slate-500 opacity-60'}`}>
                            <div className={`w-1 h-1 rounded-full ${isFirstInCategory ? 'bg-cyan-500/50' : 'bg-slate-600/30'}`} />
                            {ex.name} – {ex.sets_reps_tempo}
                            {!isFirstInCategory && <span className="text-[10px] ml-auto">🔒</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleUnlock}
                  className="w-full bg-white hover:bg-cyan-50 text-black font-black text-lg py-8 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:scale-[1.01] transition-all uppercase tracking-wide"
                >
                  Plan freischalten — 59 € einmalig
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Einmalzahlung · Lebenslanger Zugriff · Kein Abo
                </p>
              </div>

              {/* Guarantee */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm font-semibold text-white">30-Tage Geld-zurück-Garantie</p>
                <p className="text-xs text-slate-400">Wenn du innerhalb von 14 Tagen nicht zufrieden bist, erstatten wir dir den Betrag zurück.</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}