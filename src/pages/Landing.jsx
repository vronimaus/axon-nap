import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, ChevronDown, Loader2, LogOut, Wrench, Brain, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(null); // null, 'name', 'choice', 'questions'
  const [onboardingName, setOnboardingName] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [currentPain, setCurrentPain] = useState('');

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

    // Check if onboarding was started
    const onboardingStatus = localStorage.getItem('axon_onboarding_status');
    if (!onboardingStatus && !user) {
      setOnboardingStep('name');
    }
  }, []);

  const handleNameSubmit = () => {
    if (onboardingName.trim()) {
      localStorage.setItem('axon_onboarding_name', onboardingName);
      setOnboardingStep('choice');
    }
  };

  const handleChoice = (choice) => {
    localStorage.setItem('axon_onboarding_choice', choice);
    if (choice === 'guided') {
      // Show guided tour (placeholder for now)
      toast.success('Geführte Tour kommt bald! Lass uns direkt ein paar Fragen stellen.');
      setOnboardingStep('questions');
    } else {
      setOnboardingStep('questions');
    }
  };

  const handleQuestionsComplete = () => {
    // Save to localStorage
    localStorage.setItem('axon_onboarding_fitness_goals', JSON.stringify(fitnessGoals));
    localStorage.setItem('axon_onboarding_activity_level', activityLevel);
    localStorage.setItem('axon_onboarding_current_pain', currentPain);
    localStorage.setItem('axon_onboarding_status', 'completed');
    
    setOnboardingStep(null);
    toast.success('Perfekt! Jetzt kannst du starten.');
  };

  const skipOnboarding = () => {
    localStorage.setItem('axon_onboarding_status', 'skipped');
    setOnboardingStep(null);
  };

  const handleSelectOption = (mode) => {
    // Speichere die gewählte Option für nach dem Login
    localStorage.setItem('axon_selected_mode', mode);
    
    // Leite zum Login/Registrierung weiter
    base44.auth.redirectToLogin(window.location.href);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Onboarding Flow
  if (onboardingStep === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
            alt="AXON"
            className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Hallo, ich bin AXON</h1>
          <p className="text-slate-400 mb-8">Wie darf ich dich nennen?</p>
          
          <input
            type="text"
            value={onboardingName}
            onChange={(e) => setOnboardingName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Dein Name"
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

  if (onboardingStep === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Schön dich kennenzulernen, {onboardingName}!
          </h1>
          <p className="text-slate-400 mb-8">
            Möchtest du eine kurze Führung durch die App oder lieber selbst entdecken?
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => handleChoice('guided')}
              className="glass rounded-xl border border-cyan-500/30 p-8 hover:border-cyan-500/60 transition-all group"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Führung starten</h3>
              <p className="text-sm text-slate-300">Ich zeige dir die wichtigsten Features</p>
            </button>
            
            <button
              onClick={() => handleChoice('explore')}
              className="glass rounded-xl border border-purple-500/30 p-8 hover:border-purple-500/60 transition-all group"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Selbst entdecken</h3>
              <p className="text-sm text-slate-300">Ich erkunde lieber auf eigene Faust</p>
            </button>
          </div>
          
          <button
            onClick={skipOnboarding}
            className="mt-6 text-sm text-slate-500 hover:text-slate-400"
          >
            Überspringen
          </button>
        </motion.div>
      </div>
    );
  }

  if (onboardingStep === 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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

      {/* SEKTION 1: HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-900">
        {/* Body Map Background */}
        <div className="absolute inset-0 opacity-50">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/ad6e52b61_generated_image.png"
            alt="AXON Body Map Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-slate-950/40 to-slate-900/60" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
              alt="AXON Logo"
              className="w-24 h-24 mx-auto object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              Dein Gehirn bremst dich aus –
            </span>
            <br />
            <span className="text-white">wir lösen die Handbremse.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Schmerz und Steifheit sind oft keine Hardware-Fehler, sondern Schutzsignale deiner Software. Nutze das AXON Protocol, um Blockaden systematisch zu deuten und dein volles Potenzial sicher freizuschalten.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Button
              onClick={() => handleSelectOption('trial')}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-white active:text-white"
            >
              7 Tage kostenlos testen
            </Button>
            <Button
              onClick={() => handleSelectOption('direct')}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
            >
              <Zap className="w-5 h-5 mr-2" />
              Sofort kaufen – 59€
            </Button>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl border border-cyan-500/20 p-6 max-w-2xl mx-auto"
          >
            <p className="text-sm text-slate-300 text-center">
              <strong>7 Tage Testphase:</strong> Danach einmalig 59€. Jederzeit während der Testphase mit einem Klick kündbar. Kein Risiko.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEKTION 2: METHODIK */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Die neurozentrierte Kette
            </h2>
            <p className="text-xl text-slate-400">Hardware ➔ Software ➔ Integration</p>
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
              <h3 className="text-2xl font-bold text-orange-400 mb-3">Hardware-Check (MFR)</h3>
              <p className="text-slate-300 text-sm mb-2">
                <strong>MFR = Myofasziale Release</strong> – gezielter Druck auf Faszienlinien
              </p>
              <p className="text-slate-300">
                Wir lösen mechanische Spannungen an 12 strategischen Nodes, um die Informationsqualität deiner Sensoren zu verbessern.
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
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">Software-Update (Neuro)</h3>
              <p className="text-slate-300 text-sm mb-2">
                <strong>Neuro-Drills = neurologische Übungen</strong> für Augen, Balance und Propriozeption
              </p>
              <p className="text-slate-300">
                Wir kalibrieren dein visuelles und vestibuläres System (Augen & Gleichgewicht), um deinem Gehirn das Signal „Sicherheit" zu senden.
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
              <h3 className="text-2xl font-bold text-purple-400 mb-3">Integration (Belastung)</h3>
              <p className="text-slate-300">
                Wir festigen die neue Freiheit durch gezielte Kraftreize. So speichert dein Nervensystem den Fortschritt dauerhaft.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 3: DIE 3 SÄULEN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-12">
            Die 3 Säulen
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* REHAB */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-orange-500/30 p-8"
            >
              <div className="text-5xl mb-4">🟠</div>
              <h3 className="text-2xl font-bold text-orange-400 mb-3">REHAB</h3>
              <p className="text-slate-300 leading-relaxed">
                Wenn dein System „bremst", hat das einen Grund. Statt Symptome zu bekämpfen, nutzen wir die AXON-Matrix, um den Ursprung der Schutzspannung zu finden. Präzise Resets für Rücken, Nacken und Gelenke.
              </p>
            </motion.div>

            {/* FLOW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <div className="text-5xl mb-4">🔵</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-3">FLOW</h3>
              <p className="text-slate-300 leading-relaxed">
                „Zähneputzen für dein Nervensystem". Unsere 5- bis 10-minütigen Routinen sind die tägliche Wartung für deinen Körper. Einmal durch das gesamte System scannen, Steifheit lösen und Linien aktivieren – bevor Probleme entstehen.
              </p>
            </motion.div>

            {/* PERFORMANCE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-yellow-500/30 p-8"
            >
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">PERFORMANCE</h3>
              <p className="text-slate-300 leading-relaxed">
                 Wahre Stärke entsteht im Kopf. Nur wenn dein Gehirn eine Bewegung als sicher einstuft, gibt es die maximale Kraft frei. Erreiche athletische Meilensteine durch ein Protokoll, das Biologie und Trainingswissenschaften vereint. Dein persönlicher Coach verfolgt jeden Schritt mit dir – von der ersten Wiederholung bis zu deinem persönlichen Trainings-Meilenstein.
               </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEKTION 4: APP SCREENSHOTS */}
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

      {/* SEKTION 5: READINESS CHECK */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass rounded-2xl border border-purple-500/30 p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Dein System gibt den Takt vor
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Kein Körper ist jeden Tag gleich. AXON fragt dich täglich nach deinem Energie-Level und Stress-Status. Die App empfiehlt dir daraufhin exakt die Routine, die dein Nervensystem heute verarbeiten kann.
            </p>
          </div>
        </div>
      </section>

      {/* SEKTION 6: PRICING - 2 KACHELN */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Wähle deine Option
          </h2>
          <p className="text-lg text-slate-400 text-center mb-12">
            Kein Abo. Keine versteckten Kosten. AXON ist ein technisches Handbuch für deinen Körper, das dir für immer gehört.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl border border-cyan-500/30 p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Teste kostenlos</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-cyan-400">0€</span>
                <span className="text-slate-400">7 Tage</span>
              </div>
              <p className="text-slate-300 mb-8">
                Gebe deine Zahlungsdaten ein und teste 7 Tage alle Funktionen kostenlos. Danach buchen wir 59 € ab. Solltest du mit AXON keine Spannungen lösen können, kündige einfach innerhalb der Testphase.
              </p>
              <Button
                onClick={() => handleSelectOption('trial')}
                size="lg"
                variant="outline"
                className="w-full text-slate-900 border-cyan-500/50 hover:bg-cyan-500/20 hover:text-slate-900 active:text-slate-900 font-semibold"
              >
                7 Tage kostenlos testen
              </Button>
            </motion.div>

            {/* Direct Purchase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative glass rounded-2xl border border-purple-500/30 p-8 bg-gradient-to-br from-purple-500/10 to-transparent"
            >
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold">
                SOFORT ZUGRIFF
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sofort kaufen</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">59€</span>
                <span className="text-slate-400">einmalig</span>
              </div>
              <p className="text-slate-300 mb-8">
                Wie eine Sitzung bei deinem persönlichen Trainer – aber 24/7 für dich da. Entlastung, Kraft und Performance auf deinem eigenen Tempo. Unbegrenzter lebenslanger Zugriff.
              </p>
              <Button
                onClick={() => handleSelectOption('direct')}
                size="lg"
                className="w-full text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 neuro-glow"
              >
                Sofort kaufen
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