import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Brain, CheckCircle2, ArrowRight, Activity, Target, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Helmet } from 'react-helmet-async';
import HeroSection from '@/components/landing/HeroSection';
import AppInsideSection from '@/components/landing/AppInsideSection';
import PricingSection from '@/components/landing/PricingSection';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <div className="flex flex-col">
               <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
                alt="AXON"
                className="h-8 sm:h-10 object-contain"
              />
              <span className="text-[10px] text-white font-medium pl-0.5 tracking-widest mt-0.5">Neuro-Athletic-Protocol</span>
            </div>
            <span className="text-xs font-bold text-blue-500 hidden sm:inline-block border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded mt-[-10px]">2026</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#vision" className="hover:text-cyan-400 transition-colors">Das Prinzip</a>
            <a href="#inside" className="hover:text-cyan-400 transition-colors">App Einblick</a>
            <Link to={createPageUrl('KnowledgeHub')} className="hover:text-cyan-400 transition-colors">Knowledge Hub</Link>
            {user ? (
                <Link to={createPageUrl('Dashboard')} className="hover:text-cyan-400 transition-colors">
                  Dashboard
                </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
               <Link to={createPageUrl('Dashboard')}>
                 <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-4 sm:px-6 text-[10px] sm:text-xs uppercase tracking-wide">
                    Dashboard
                 </Button>
               </Link>
            ) : (
                <Button 
                    onClick={() => handleSelectOption('direct')}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-4 sm:px-6 text-[10px] sm:text-xs uppercase tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
                >
                    Sichern
                </Button>
            )}
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white p-1">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-slate-950/95 backdrop-blur-md border-b border-white/5 z-40 p-6 flex flex-col gap-5">
          <a href="#vision" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">Das Prinzip</a>
          <a href="#inside" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">App Einblick</a>
          <Link to={createPageUrl('KnowledgeHub')} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-cyan-400">Knowledge Hub</Link>
          <div className="h-px bg-white/10 w-full my-1"></div>
          <Link to={createPageUrl('Imprint')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Impressum</Link>
          <Link to={createPageUrl('Privacy')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Datenschutz</Link>
          <Link to={createPageUrl('Terms')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">AGB</Link>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection onCtaClick={() => handleSelectOption('direct')} />

      {/* App Inside Section */}
      <AppInsideSection />

      {/* Science / Evidence Section (Preserving Neural Control texts) */}
      <section id="science" className="py-24">
        <div className="container mx-auto px-6 text-center">
            <h3 className="text-2xl md:text-4xl font-black mb-6 uppercase tracking-tighter text-white">Evidenz statt Hype.</h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed text-lg">
                AXON basiert auf den Erkenntnissen der modernen Faszienforschung, Neuro-Athletik und Biomechanik. 
                Wir übersetzen komplexe Wissenschaft in einfache 30-Sekunden-Protokolle.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="space-y-4 bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-300"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                        <Brain className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-xl text-white">Neural Control</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Bewegung entsteht nicht im Muskel, sondern im Hirnstamm. Wenn deine Augen oder dein Gleichgewicht unklare Signale senden, zieht das Gehirn die „neuronale Handbremse“. Wir lösen sie.
                    </p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="space-y-4 bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-300"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-xl text-white">Fascial Chains</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Wir trainieren keine isolierten Muskeln, sondern myofasziale Ketten. Wir nutzen die Architektur deines Bindegewebes, um Spannungen dort zu lösen, wo sie tatsächlich entstehen.
                    </p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="space-y-4 bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all duration-300"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-xl text-white">Loaded Mobility</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Dehnen allein reicht nicht. Dein Gehirn lässt Spannung erst dauerhaft los, wenn es lernt, in der neuen Beweglichkeit Kraft zu erzeugen. Wir sichern deinen Fortschritt durch Belastung.
                    </p>
                </motion.div>
            </div>

            <div className="mt-16">
                 <Link to={createPageUrl('KnowledgeHub')} className="inline-flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-widest hover:text-cyan-300 transition-colors group">
                    KnowledgeHub durchsuchen 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection onCtaClick={() => handleSelectOption('direct')} />


    </div>
  );
}