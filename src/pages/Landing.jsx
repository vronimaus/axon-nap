import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Brain, CheckCircle2, ArrowRight, Activity, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Helmet } from 'react-helmet-async';
import DopamineChart from '@/components/landing/DopamineChart';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- EXISTING LOGIC: Auth Check ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stayOnLanding = localStorage.getItem('stay_on_landing') === 'true';
        const urlParams = new URLSearchParams(window.location.search);
        const previewMode = urlParams.get('preview') === 'true';

        try {
          const currentUser = await base44.auth.me();
          setUser(currentUser);

          // Skip redirect if explicitly staying on landing or in preview mode
          if (stayOnLanding || previewMode) {
            setIsLoading(false);
            return;
          }

          // Redirect to Dashboard if paid or active trial
          if (currentUser?.has_paid) {
            window.location.href = createPageUrl('Dashboard');
            return;
          }

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
          // User not logged in
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // --- EXISTING LOGIC: Selection Handler ---
  const handleSelectOption = (mode) => {
    base44.analytics.track({
      eventName: mode === 'trial' ? 'trial_started' : 'direct_purchase_initiated',
      properties: { source: 'landing_page_v2' }
    });

    localStorage.setItem('axon_selected_mode', mode);
    base44.auth.redirectToLogin(window.location.href);
  };

  // --- NEW DESIGN IMPLEMENTATION ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-amber-500/30 font-sans">
      <Helmet>
        <title>AXON - Dein neuronales Software-Update</title>
        <meta name="description" content="Hör auf zu trainieren. Fang an zu optimieren. AXON ist das neuronale Betriebssystem für deinen Körper. Einmal zahlen, für immer besitzen." />
      </Helmet>

      {/* Navigation */}
      <nav className="fixed w-full z-50 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/60d205ae0_AxonLogo180x35.png"
              alt="AXON"
              className="h-6 sm:h-7 object-contain"
            />
            <span className="text-xs font-bold text-blue-500 hidden sm:inline-block border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded">2026</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#science" className="hover:text-white transition-colors">Wissenschaft</a>
            <a href="#how" className="hover:text-white transition-colors">Methode</a>
            <a href="#pricing" className="hover:text-white transition-colors">Besitz statt Miete</a>
            {user ? (
                <Link to={createPageUrl('Dashboard')} className="hover:text-amber-500 transition-colors">
                  Dashboard
                </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
               <Link to={createPageUrl('Dashboard')}>
                 <Button className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-full px-6">
                    Zum Dashboard
                 </Button>
               </Link>
            ) : (
                <Button 
                    onClick={() => handleSelectOption('direct')}
                    className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-full px-6 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300"
                >
                    Sichern
                </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Header / Hero */}
      <header className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            Limited Early Stage Access
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight"
          >
            Hör auf zu trainieren.<br />
            Fang an zu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-blue-500">optimieren.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Dein Körper hat die beste Hardware der Welt – aber deine Software ist veraltet. 
            Sichere dir lebenslangen Zugriff auf das neuronale Betriebssystem.<br />
            <span className="text-white font-bold mt-2 block">Kein Abo. Einmal zahlen. Für immer besitzen.</span>
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row justify-center items-center gap-6"
          >
            <Button 
                onClick={() => handleSelectOption('direct')}
                className="h-auto py-5 px-10 text-lg md:text-xl font-black rounded-[2rem] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 w-full md:w-auto"
            >
                JETZT SICHERN FÜR 59,90 €
            </Button>
            <span className="text-slate-500 text-sm italic">„Der 2-Minuten-Beweis wird dich überzeugen.“</span>
          </motion.div>
        </div>
      </header>

      {/* Main Content - Bento Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: Hardware vs Software */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                id="how" 
                className="md:col-span-8 bg-slate-900/40 border border-white/5 p-8 md:p-12 rounded-[2rem] hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1"
            >
                <h3 className="text-3xl font-bold mb-6">Hardware vs. <span className="text-blue-500">Software</span></h3>
                <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                    Fitnessstudios pumpen nur die „Hardware“ (Muskeln). Wenn dein Gehirn aber die „neuronale Handbremse“ angezogen hat, 
                    weil dein Gleichgewichtssinn oder deine Augen unklare Signale senden, wirst du niemals dein volles Potenzial erreichen. 
                    AXON löst diese Bremsen in Echtzeit.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <span className="block text-amber-500 font-black text-4xl mb-2">30 SEK</span>
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Dauer eines Neuro-Hacks</span>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <span className="block text-emerald-500 font-black text-4xl mb-2">+15%</span>
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Sofort mehr Beweglichkeit</span>
                    </div>
                </div>
            </motion.div>

            {/* Bento Card 2: Der Audit Beweis */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-4 bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1"
            >
                <div className="text-5xl mb-6 bg-blue-500/20 w-20 h-20 rounded-2xl flex items-center justify-center">🧪</div>
                <div>
                    <h4 className="font-bold text-xl mb-3 uppercase text-blue-100">Der Audit-Beweis</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">Wir raten nicht. Wir testen. <br/><span className="text-blue-400 font-semibold">Vorbeuge-Test → 30 Sek Drill → Re-Test.</span><br/>Wenn es funktioniert, siehst du es sofort.</p>
                </div>
            </motion.div>

            {/* Bento Card 3: Wissenschaft */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                id="science" 
                className="md:col-span-12 bg-slate-900/40 border border-white/5 p-10 rounded-[2rem] hover:border-blue-500/30 transition-all duration-500"
            >
                <h3 className="text-center text-2xl md:text-3xl font-bold mb-12 uppercase tracking-tight text-slate-200">Wissenschaftliches Fundament</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="space-y-3 group">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-1">Faszien-Pioniere</span>
                        <h5 className="font-bold text-base text-slate-300 group-hover:text-white transition-colors">Schleip / Stecco</h5>
                    </div>
                    <div className="space-y-3 group">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-1">Funktionale Ketten</span>
                        <h5 className="font-bold text-base text-slate-300 group-hover:text-white transition-colors">Myers / Gray</h5>
                    </div>
                    <div className="space-y-3 group">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-1">Athletik-Standards</span>
                        <h5 className="font-bold text-base text-slate-300 group-hover:text-white transition-colors">Vern Gambetta</h5>
                    </div>
                    <div className="space-y-3 group">
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block mb-1">Mobility-Klinik</span>
                        <h5 className="font-bold text-base text-slate-300 group-hover:text-white transition-colors">Kelly Starrett</h5>
                    </div>
                </div>
                <p className="text-center text-xs text-slate-600 mt-12 max-w-2xl mx-auto italic leading-relaxed">
                    AXON ist eine unabhängige Synthese-Plattform. Die Algorithmen basieren auf den weltweit anerkannten biomechanischen 
                    und faszialen Lehren dieser Experten, ohne dass eine direkte geschäftliche Kooperation besteht.
                </p>
            </motion.div>

            {/* Bento Card 4: Dopamine Chart */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-6 bg-slate-900/40 border border-white/5 p-8 md:p-10 rounded-[2rem] hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1"
            >
                <h3 className="text-2xl font-bold mb-6">Kein „Grind“. <span className="text-emerald-400">Flow.</span></h3>
                <div className="h-[250px] w-full bg-slate-950/30 rounded-xl border border-white/5 p-4">
                    <DopamineChart />
                </div>
                <p className="text-xs text-slate-500 mt-6 italic text-center">Warum 90% bei AXON bleiben: Sofortige Belohnung statt wochenlanges Warten.</p>
            </motion.div>

            {/* Bento Card 5: Pricing */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                id="pricing" 
                className="md:col-span-6 bg-amber-900/10 border-2 border-amber-500/50 p-8 md:p-10 rounded-[2rem] relative overflow-hidden group hover:border-amber-500 transition-all duration-500 hover:bg-amber-900/20"
            >
                <div className="absolute top-6 right-6 md:right-8 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-amber-500/20 animate-pulse">
                    Lifetime Deal
                </div>
                
                <h3 className="text-3xl font-black mb-2 text-white">Besitz statt Miete.</h3>
                <p className="text-amber-500/80 text-sm font-bold uppercase tracking-wide mb-6">Das Anti-Abo Modell</p>

                <div className="flex items-baseline space-x-3 mb-8">
                    <span className="text-5xl md:text-6xl font-black text-white">59,90 €</span>
                    <span className="text-slate-500 line-through text-xl decoration-2">179€</span>
                </div>

                <ul className="space-y-4 mb-10">
                    {[
                        "Voller Zugriff auf alle 226 AXON-Codes",
                        "Neuro-, Breathing- & Mobility-Flows",
                        "KI-basierte Trainingsanpassung (Daily Fluidity)",
                        "Lebenslange Lizenz ohne monatliche Kosten"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-black">
                                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={4} />
                            </div>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>

                <Button 
                    onClick={() => handleSelectOption('direct')}
                    className="w-full py-6 text-lg font-black uppercase tracking-widest rounded-2xl bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/10 hover:shadow-amber-500/30 transition-all duration-300"
                >
                    Jetzt lebenslang sichern
                </Button>
            </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8 text-xs font-bold uppercase tracking-widest text-slate-500">
                <Link to={createPageUrl('Imprint')} className="hover:text-amber-500 transition-colors">Impressum</Link>
                <span className="hidden md:inline">•</span>
                <Link to={createPageUrl('Privacy')} className="hover:text-amber-500 transition-colors">Datenschutz</Link>
                <span className="hidden md:inline">•</span>
                <Link to={createPageUrl('Terms')} className="hover:text-amber-500 transition-colors">AGB</Link>
            </div>
            
            <p className="text-slate-500 text-xs mb-4 uppercase tracking-[0.3em] font-bold">
                AXON Intelligent Training System | Early Stage 2026
            </p>
            <p className="text-slate-600 text-[10px] max-w-xl mx-auto leading-relaxed">
                Datensicherheit nach DSGVO. On-Device KI-Verarbeitung. 
                Keine versteckten Gebühren. Besitze deine Gesundheit.
            </p>
        </div>
      </footer>
    </div>
  );
}