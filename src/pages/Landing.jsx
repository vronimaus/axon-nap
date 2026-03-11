import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Helmet } from 'react-helmet-async';
import HeroSection from '@/components/landing/HeroSection';
import PainAgitationSection from '@/components/landing/PainAgitationSection';
import ThreeSystemSection from '@/components/landing/ThreeSystemSection';
import { Suspense, lazy } from 'react';
import { useUser } from '@/components/useUser';

const AppInsideSection = lazy(() => import('@/components/landing/AppInsideSection'));
const PricingSection = lazy(() => import('@/components/landing/PricingSection'));

export default function Landing() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    try {
      const stayOnLanding = localStorage.getItem('stay_on_landing') === 'true';
      const urlParams = new URLSearchParams(window.location.search);
      const previewMode = urlParams.get('preview') === 'true';
      if (!user) { setIsLoading(false); return; }
      if (stayOnLanding || previewMode) { setIsLoading(false); return; }
      if (user.has_paid) { window.location.href = createPageUrl('Dashboard'); return; }
      if (user.trial_start_date) {
        const daysElapsed = Math.floor((new Date() - new Date(user.trial_start_date)) / (1000 * 60 * 60 * 24));
        if (daysElapsed < 7) { window.location.href = createPageUrl('Dashboard'); return; }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user, isUserLoading]);

  const handleSelectOption = (mode) => {
    base44.analytics.track({
      eventName: mode === 'trial' ? 'trial_started' : 'direct_purchase_initiated',
      properties: { source: 'landing_page_v2' }
    });
    localStorage.setItem('axon_selected_mode', mode);
    base44.auth.redirectToLogin(window.location.href);
  };

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "AXON Protocol - Lebenslanger Zugriff",
    "description": "Neuro-Athletic Training App mit personalisierten Rehab-, Flow- und Trainingsplänen. Selbsthilfe bei Verspannungen, Schmerzen und Bewegungseinschränkungen.",
    "brand": { "@type": "Brand", "name": "AXON" },
    "offers": { "@type": "Offer", "url": "https://axon-nap.de", "priceCurrency": "EUR", "price": "59.90", "availability": "https://schema.org/InStock" }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-amber-500/30 font-sans">
      <Helmet>
        <title>AXON – Verspannungen & Schmerzen selbst lösen | Neuro-Athletic Protocol</title>
        <meta name="description" content="Kein Physio. Keine Wartezeit. AXON gibt dir das Protokoll, das Physios anwenden – zum selbst machen. Nacken, Rücken, Schulter: Schmerzpunkt markieren, Plan erhalten, loslegen." />
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      </Helmet>

      {/* Navigation */}
      <nav className="fixed w-full z-50 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col items-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
              alt="AXON"
              className="h-8 sm:h-10 object-contain"
              loading="lazy"
              width="100"
              height="40"
            />
            <span className="text-[10px] text-white font-medium tracking-widest mt-0.5">Neuro-Athletic-Protocol</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#system" className="hover:text-cyan-400 transition-colors">Das System</a>
            <a href="#inside" className="hover:text-cyan-400 transition-colors">App Einblick</a>
            <Link to={createPageUrl('KnowledgeHub')} className="hover:text-cyan-400 transition-colors">Knowledge Hub</Link>
            <Link to={createPageUrl('FAQ')} className="hover:text-cyan-400 transition-colors">FAQ</Link>
            {user && <Link to={createPageUrl('Dashboard')} className="hover:text-cyan-400 transition-colors">Dashboard</Link>}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {user ? (
               <>
                 <Link to={createPageUrl('Dashboard')}>
                   <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-4 sm:px-6 text-[10px] sm:text-xs uppercase tracking-wide">
                     Dashboard
                   </Button>
                 </Link>
               </>
             ) : (
               <>
                 <Button
                   onClick={() => base44.auth.redirectToLogin(window.location.href)}
                   variant="outline"
                   className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-bold rounded-full px-3 sm:px-5 text-[10px] sm:text-xs uppercase tracking-wide transition-all duration-300"
                 >
                   Login
                 </Button>
                 <Button
                   onClick={() => window.location.href = createPageUrl('RehabFunnel')}
                   className="bg-white hover:bg-cyan-50 text-black font-bold rounded-full px-4 sm:px-6 text-[10px] sm:text-xs uppercase tracking-wide transition-all duration-300"
                 >
                   Plan erstellen
                 </Button>
               </>
             )}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white p-1">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-slate-950/95 backdrop-blur-md border-b border-white/5 z-40 p-6 flex flex-col gap-5">
          <a href="#system" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">Das System</a>
          <a href="#inside" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">App Einblick</a>
          <Link to={createPageUrl('KnowledgeHub')} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-cyan-400">Knowledge Hub</Link>
          <Link to={createPageUrl('FAQ')} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-cyan-400">FAQ</Link>
          <div className="h-px bg-white/10 w-full my-1" />
          <Link to={createPageUrl('Imprint')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Impressum</Link>
          <Link to={createPageUrl('Privacy')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Datenschutz</Link>
          <Link to={createPageUrl('Terms')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">AGB</Link>
        </div>
      )}

      {/* 1. Hero */}
      <HeroSection onCtaClick={() => window.location.href = createPageUrl('RehabFunnel')} />

      {/* 2. Pain Agitation – "Ich will mir selbst helfen" */}
      <PainAgitationSection onFunnelClick={() => window.location.href = createPageUrl('RehabFunnel')} />

      {/* 3. Das System – Rehab / Flow / Goals als Loop */}
      <ThreeSystemSection />

      {/* 4. App Einblick */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-cyan-500/50">Lade Engine...</div>}>
        <AppInsideSection />
      </Suspense>

      {/* 5. Evidenz / Wissenschaft */}
      <section id="science" className="py-20 bg-slate-950">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-4">Kein Esoterik. Keine Hacks.</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Evidenz statt Hype.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12 text-base leading-relaxed">
            AXON basiert auf publizierter Forschung aus Faszienbiologie, Neuromotorischer Rehabilitation und funktioneller Biomechanik —
            übersetzt in Protokolle, die du selbst anwendest. In unter 15 Minuten.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { label: 'MFR', title: 'Myofasziale Ketten', text: 'Beschwerden entstehen selten dort, wo sie spürbar sind. Myofasziale Ketten übertragen Spannung über den ganzen Körper. AXON findet den Ursprung.' },
              { label: 'FMV', title: 'Funktionelle Bewegung', text: 'Isolierte Übungen greifen zu kurz. Bewegung ist ein komplexes Zusammenspiel von Gelenken, Ketten und Mustern — AXON trainiert das System, nicht den Muskel.' },
              { label: 'NDT', title: 'Neurologische Verankerung', text: 'Neue Beweglichkeit muss verankert werden. Das Gehirn speichert Fortschritt erst, wenn Bewegung unter Kontrolle erprobt wurde. AXON schließt diesen Loop.' },
            ].map((s, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{s.label}</span>
                <h3 className="font-bold text-white">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10">
            <Link to={createPageUrl('KnowledgeHub')} className="inline-flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-widest hover:text-cyan-300 transition-colors group">
              KnowledgeHub durchsuchen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-cyan-500/50">Lade Optionen...</div>}>
        <PricingSection onCtaClick={handleSelectOption} />
      </Suspense>

    </div>
  );
}