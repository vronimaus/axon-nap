import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, ChevronDown, Loader2, LogOut, Wrench, Brain, Dumbbell, Target, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('name'); // 'name', 'questions'
  const [onboardingName, setOnboardingName] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [currentPain, setCurrentPain] = useState('');
  const [pendingMode, setPendingMode] = useState(null); // 'trial' or 'direct'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stayOnLanding = localStorage.getItem('stay_on_landing') === 'true';
        const urlParams = new URLSearchParams(window.location.search);
        const previewMode = urlParams.get('preview') === 'true';

                try {
                  const currentUser = await base44.auth.me();
                  setUser(currentUser);

                  // Skip redirect wenn explizit auf Landing bleiben oder Preview-Modus
                  if (stayOnLanding || previewMode) {
                    setIsLoading(false);
                    return;
                  }

                  // Eingeloggte User + bezahlt - zum Dashboard
                  if (currentUser?.has_paid) {
                    window.location.href = createPageUrl('Dashboard');
                    return;
                  }

                  // Eingeloggte User + aktiver Trial - zum Dashboard
                  if (currentUser && currentUser.trial_start_date) {
                    const startDate = new Date(currentUser.trial_start_date);
                    const now = new Date();
                    const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
                    if (daysElapsed < 7) {
                      window.location.href = createPageUrl('Dashboard');
                      return;
                    }
                  }
                } catch (e) {
                  // User nicht eingeloggt - das ist ok, Landing ist öffentlich
                  setUser(null);
                }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();

    // Load saved onboarding data if exists
    const savedName = localStorage.getItem('axon_onboarding_name');
    if (savedName) {
      setOnboardingName(savedName);
    }
  }, []);

  const handleStartOnboarding = (mode) => {
    setPendingMode(mode);
    setShowOnboarding(true);
    setOnboardingStep('name');
  };

  const handleNameSubmit = () => {
    if (onboardingName.trim()) {
      localStorage.setItem('axon_onboarding_name', onboardingName);
      setOnboardingStep('questions');
    }
  };

  const handleQuestionsComplete = () => {
    // Save to localStorage
    localStorage.setItem('axon_onboarding_fitness_goals', JSON.stringify(fitnessGoals));
    localStorage.setItem('axon_onboarding_activity_level', activityLevel);
    localStorage.setItem('axon_onboarding_current_pain', currentPain);
    localStorage.setItem('axon_onboarding_status', 'completed');
    
    setShowOnboarding(false);
    toast.success('Perfekt! Leite dich weiter...');
    
    // Continue with the pending mode
    if (pendingMode) {
      localStorage.setItem('axon_selected_mode', pendingMode);
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('axon_onboarding_status', 'skipped');
    setShowOnboarding(false);
    
    // Continue with the pending mode
    if (pendingMode) {
      localStorage.setItem('axon_selected_mode', pendingMode);
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const handleSelectOption = (mode) => {
    // Check if we have onboarding data
    const hasOnboardingData = localStorage.getItem('axon_onboarding_status') === 'completed';
    
    if (!hasOnboardingData) {
      // Start onboarding flow first
      handleStartOnboarding(mode);
    } else {
      // Speichere die gewählte Option für nach dem Login
      localStorage.setItem('axon_selected_mode', mode);
      
      // Leite zum Login/Registrierung weiter
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Onboarding Modal
  const OnboardingModal = () => {
    if (onboardingStep === 'name') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON"
              className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Willkommen bei AXON</h1>
            <p className="text-slate-400 mb-8">Damit wir dich optimal unterstützen können – wie dürfen wir dich nennen?</p>
            
            <input
              type="text"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Dein Vorname"
              className="w-full px-6 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 mb-4 text-center text-lg"
              autoFocus
            />
            
            <Button
              onClick={handleNameSubmit}
              disabled={!onboardingName.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12"
            >
              Weiter
            </Button>
            
            <button
              onClick={skipOnboarding}
              className="mt-4 text-sm text-slate-500 hover:text-slate-400"
            >
              Überspringen
            </button>
          </motion.div>
        </div>
      );
    }

    if (onboardingStep === 'questions') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full my-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Noch ein paar Fragen, {onboardingName}
            </h1>
            <p className="text-slate-400 mb-8 text-center">
              So können wir deine Erfahrung optimal personalisieren
            </p>
          
          <div className="space-y-6">
            {/* Fitness Goals */}
            <div className="glass rounded-xl border border-cyan-500/30 p-6">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Was ist dein Hauptziel?</h3>
              <p className="text-xs text-slate-400 mb-4">
                Diese Information hilft uns, die passenden Routinen für dich zu finden.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'improve_mobility', label: 'Mehr Beweglichkeit' },
                  { value: 'reduce_pain', label: 'Schmerzen reduzieren' },
                  { value: 'build_strength', label: 'Stärker werden' },
                  { value: 'improve_performance', label: 'Performance steigern' }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setFitnessGoals(prev => 
                      prev.includes(goal.value) 
                        ? prev.filter(g => g !== goal.value)
                        : [...prev, goal.value]
                    )}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      fitnessGoals.includes(goal.value)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    } border`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div className="glass rounded-xl border border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Wie aktiv bist du aktuell?</h3>
              <p className="text-xs text-slate-400 mb-4">
                So können wir die Intensität optimal anpassen.
              </p>
              <div className="space-y-2">
                {[
                  { value: 'sedentary', label: 'Wenig Bewegung' },
                  { value: 'lightly_active', label: 'Leicht aktiv (1-2x/Woche)' },
                  { value: 'moderately_active', label: 'Moderat aktiv (3-4x/Woche)' },
                  { value: 'very_active', label: 'Sehr aktiv (5-6x/Woche)' },
                  { value: 'athlete', label: 'Athlet (täglich)' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setActivityLevel(level.value)}
                    className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-all ${
                      activityLevel === level.value
                        ? 'bg-purple-500/30 border-purple-400 text-purple-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    } border`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Pain */}
            <div className="glass rounded-xl border border-orange-500/30 p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-2">Hast du aktuell Beschwerden?</h3>
              <p className="text-xs text-slate-400 mb-4">
                Optional: Hilft uns, problematische Bereiche zu identifizieren.
              </p>
              <input
                type="text"
                value={currentPain}
                onChange={(e) => setCurrentPain(e.target.value)}
                placeholder="z.B. Nacken, unterer Rücken, Knie..."
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={skipOnboarding}
              className="px-6 py-3 rounded-xl text-slate-400 hover:text-slate-300"
            >
              Überspringen
            </button>
            <Button
              onClick={handleQuestionsComplete}
              disabled={fitnessGoals.length === 0 || !activityLevel}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 h-12"
            >
              Fertig
            </Button>
            </div>
          </motion.div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal />}
      </AnimatePresence>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON"
              className="w-8 h-8"
            />
            <span className="font-bold text-cyan-400">AXON</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={createPageUrl('Dashboard')}>
                  <Button size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400">
                    Zur App
                  </Button>
                </Link>
                <button
                  onClick={() => base44.auth.logout()}
                  className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* SEKTION 1: HERO - NEU */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900">
        {/* Body Map Background */}
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
            alt="AXON Body Map Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-slate-950/50 to-slate-900/70" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON Logo"
              className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Entfessle deine Bewegung.
            </span>
            <br />
            <span className="text-white">Optimiere dein System.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Meistere dein Potenzial.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            AXON vereint <span className="text-cyan-400 font-semibold">Physiotherapie</span>, <span className="text-purple-400 font-semibold">Neuro-Athletik</span> und <span className="text-amber-400 font-semibold">Personal Training</span> in einer intelligenten App. Personalisiert durch KI, immer verfügbar, wissenschaftlich fundiert.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              onClick={() => handleSelectOption('trial')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              <Zap className="w-5 h-5 mr-2" />
              7 Tage kostenlos testen
            </Button>
            <Button
              onClick={() => handleSelectOption('direct')}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              Sofort kaufen – 59€
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>30 Tage Geld-zurück-Garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>Keine versteckten Kosten</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <span>Kein Abo</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 2: WAS IST AXON? - NEU */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Was ist AXON?
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              AXON ist dein <span className="text-cyan-400 font-semibold">persönlicher Coach</span>, der rund um die Uhr verfügbar ist. Die App nutzt modernste Erkenntnisse aus Neurowissenschaft, Faszienforschung und Trainingslehre, um dir ein völlig <span className="text-purple-400 font-semibold">individuelles Erlebnis</span> zu bieten.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3">KI-gestützte Personalisierung</h3>
              <p className="text-slate-300 text-sm">
                AXON analysiert deine Bedürfnisse, deinen Fortschritt und deine Tagesform – und passt sich dynamisch an.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-purple-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Wissenschaftlich fundiert</h3>
              <p className="text-slate-300 text-sm">
                Basierend auf den Methoden von Stecco (Faszien), Gray Cook (FMS), Pavel Tsatsouline (Kraft) und weiteren Experten.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-amber-500/30 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-3">24/7 verfügbar</h3>
              <p className="text-slate-300 text-sm">
                Keine Termine nötig. Trainiere wann und wo du willst – AXON ist immer für dich da.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 3: METHODIK */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Die AXON-Methode
            </h2>
            <p className="text-xl text-slate-400">Hardware ➔ Software ➔ Integration</p>
            <p className="text-slate-400 mt-4 max-w-3xl mx-auto">
              Dein Körper ist ein System. AXON optimiert jede Ebene: von der Struktur über die Steuerung bis zur Belastbarkeit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Hardware */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">1. Hardware-Check (MFR)</h3>
              <p className="text-slate-300 text-sm mb-2">
                <strong>MFR = Myofasziale Release</strong> – gezielter Druck auf Faszienlinien
              </p>
              <p className="text-slate-300">
                Wir lösen Spannungen in deinem Bindegewebe an 12 strategischen Punkten. Das verbessert die Qualität der Signale, die dein Gehirn empfängt, und gibt dir mehr Bewegungsfreiheit.
              </p>
            </motion.div>

            {/* Software */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">2. Software-Update (Neuro)</h3>
              <p className="text-slate-300 text-sm mb-2">
                <strong>Neuro-Drills = neurologische Übungen</strong> für Augen, Balance und Propriozeption
              </p>
              <p className="text-slate-300">
                Wir trainieren dein visuelles und vestibuläres System (Augen & Gleichgewicht). Wenn dein Gehirn diese Systeme als sicher einstuft, gibt es mehr Bewegungsfreiheit und Kraft frei.
              </p>
            </motion.div>

            {/* Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-purple-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">3. Integration (Kraft)</h3>
              <p className="text-slate-300">
                Wir festigen die neu gewonnene Bewegungsfreiheit durch kontrollierte Belastung. So lernt dein Nervensystem, die neuen Muster dauerhaft zu speichern und im Alltag anzuwenden.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 4: DIE 3 SÄULEN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
            Die 3 Säulen von AXON
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12 max-w-3xl mx-auto">
            Egal ob du Schmerzen lösen, Performance steigern oder dein System pflegen willst – AXON begleitet dich auf jedem Schritt.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-red-500/30 p-8 hover:border-red-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-red-400 mb-3 text-center">REHAB</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Akute Beschwerden? Die AXON-Diagnose findet die Root Cause deines Schmerzes. Statt Symptome zu bekämpfen, lösen wir die eigentliche Ursache – mit präzisen Resets für Hardware & Software.
              </p>
            </motion.div>

            {/* FLOW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8 hover:border-cyan-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 mx-auto">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3 text-center">FLOW</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Deine tägliche Körperpflege. 5–15 Minuten Routinen scannen dein gesamtes System, lösen Steifheit und halten dich beweglich. Wie Zähneputzen – nur für dein Nervensystem.
              </p>
            </motion.div>

            {/* GOALS (ehemals PERFORMANCE) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-amber-500/30 p-8 hover:border-amber-500/60 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-amber-400 mb-3 text-center">GOALS</h3>
              <p className="text-slate-300 leading-relaxed text-center">
                Schalte neue Fähigkeiten frei. Wahre Kraft entsteht im Gehirn – nur wenn es eine Bewegung als sicher einstuft, gibt es maximale Power frei. Dein persönlicher Coach begleitet dich von der ersten Wiederholung bis zum Meilenstein.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 5: PERSONALISIERUNG & KI */}
      <section className="py-20 relative bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Dein System gibt den Takt vor
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              AXON passt sich dir an – jeden Tag neu.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-purple-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Daily Readiness Check</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Kein Körper ist jeden Tag gleich. AXON fragt dich nach deinem Energie-Level, Stress und Schlafqualität – und empfiehlt dir exakt die Routine, die dein Nervensystem heute verarbeiten kann.
              </p>
              <p className="text-sm text-slate-400">
                Grün = Go Hard. Gelb = Moderate dich. Rot = Recovery First.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">KI-gestützte Analyse</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                AXON lernt dich kennen. Die App trackt deine Fortschritte, erkennt Muster und passt deine Trainingspläne dynamisch an. Je länger du AXON nutzt, desto präziser wird die Empfehlung.
              </p>
              <p className="text-sm text-slate-400">
                Deine Daten gehören dir – AXON nutzt sie nur, um dich besser zu unterstützen.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 6: APP SCREENSHOTS */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            So sieht AXON aus
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Drei Modi, ein System – speziell für deine Bedürfnisse
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-red-500/30 overflow-hidden"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/6c0e02a2d_image.png"
                alt="REHAB - Detective Mode"
                className="w-full h-auto"
              />
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-red-400 mb-1">REHAB</h3>
                <p className="text-xs text-slate-400">Detective Mode: Finde die Root Cause deines Schmerzes</p>
              </div>
            </motion.div>

            {/* PERFORMANCE Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-yellow-500/30 overflow-hidden"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/707e1e9f9_image.png"
                alt="PERFORMANCE - Goal Tracking"
                className="w-full h-auto"
              />
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-yellow-400 mb-1">PERFORMANCE</h3>
                <p className="text-xs text-slate-400">Highscores tracken: Verfolge jeden Fortschritt</p>
              </div>
            </motion.div>

            {/* HARDWARE Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-orange-500/30 overflow-hidden"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/664fb6302_image.png"
                alt="HARDWARE - 15-Min Reset"
                className="w-full h-auto"
              />
              <div className="p-4 bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="font-bold text-orange-400 mb-1">HARDWARE</h3>
                <p className="text-xs text-slate-400">15-Min Reset: Alle 12 Nodes – dein täglicher Check-up</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 7: WARUM AXON */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Warum AXON?
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12">
            Dein persönlicher Experte – immer dabei
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl border border-cyan-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-3">Statt jedes Mal zum Physio</h3>
              <p className="text-sm text-slate-300">
                Bei kleinen Beschwerden kannst du dir sofort selbst helfen – wann und wo du willst. Für ernsthafte Verletzungen bleibt der Arztbesuch natürlich erste Wahl.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl border border-purple-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-3">Dein Personal Trainer</h3>
              <p className="text-sm text-slate-300">
                Kein Termin nötig, keine Gruppenkurse. AXON ist 24/7 für dich da – im Gym, zuhause oder unterwegs. Maßgeschneiderte Trainingspläne für deine Ziele.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl border border-amber-500/30 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-3">Verstehe deinen Körper</h3>
              <p className="text-sm text-slate-300">
                AXON erklärt dir, warum etwas weh tut und wie du es löst. Du lernst, deinem Körper zu vertrauen und Bewegung als präventive Medizin zu nutzen.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-cyan-500/30 p-8 text-center mb-16"
          >
            <p className="text-2xl text-white font-semibold mb-2">
              Physio + Neuroathletik + Personal Training
            </p>
            <p className="text-lg text-slate-400">
              Alles in einer App – für den Preis einer einzigen Sitzung beim Experten
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 8: PREISE */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Dein risikofreier Start
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12">
            Einmalzahlung. Kein Abo. Lebenslanger Zugriff.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold">
                EMPFOHLEN
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">7 Tage kostenlos testen</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-cyan-400">0€</span>
                <span className="text-slate-400">dann 59€</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>7 Tage vollständiger Zugriff auf alle Features</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Danach einmalig 59€ – kein Abo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Jederzeit während der Testphase kündbar</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-green-400">30 Tage Geld-zurück-Garantie</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSelectOption('trial')}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-semibold"
              >
                Jetzt kostenlos starten
              </Button>
            </motion.div>

            {/* Direct Purchase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-amber-500/30 p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Sofort starten</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">59€</span>
                <span className="text-slate-400">einmalig</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Sofortiger Zugriff auf alle Features</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Einmalzahlung – lebenslanger Zugang</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Kein Abo, keine versteckten Kosten</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-green-400">30 Tage Geld-zurück-Garantie</span>
                </li>
              </ul>
              <Button
                onClick={() => handleSelectOption('direct')}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                Jetzt kaufen
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2026 AXON Protocol | Neuro-Athletic Excellence</p>
        </div>
      </footer>
    </div>
  );
}