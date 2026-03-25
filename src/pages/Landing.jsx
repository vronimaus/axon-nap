import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Helmet } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import { useUser } from '@/components/useUser';

// Eager-loaded (above the fold)
import HeroSection from '@/components/landing/HeroSection';
import PainAgitationSection from '@/components/landing/PainAgitationSection';
import SystemAuditSection from '@/components/landing/SystemAuditSection';

// Lazy-loaded (below the fold)
const ThreeSystemSection = lazy(() => import('@/components/landing/ThreeSystemSection'));
const AudioCoachSection = lazy(() => import('@/components/landing/AudioCoachSection'));
const FounderStorySection = lazy(() => import('@/components/landing/FounderStorySection'));
const FairnessSection = lazy(() => import('@/components/landing/FairnessSection'));

const LazyFallback = () => (
  <div className="h-40 flex items-center justify-center">
    <div className="w-2 h-2 rounded-full bg-cyan-500/40 animate-pulse" />
  </div>
);

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
      properties: { source: 'landing_page_v3_modular' }
    });
    localStorage.setItem('axon_selected_mode', mode);
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleFunnelClick = () => {
    window.location.href = createPageUrl('RehabFunnel');
  };

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "AXON Protocol - Lebenslanger Zugriff",
    "description": "Neuro-Athletic Training App mit personalisierten Rehab-, Flow- und Trainingsplänen.",
    "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png",
    "brand": { "@type": "Brand", "name": "AXON" },
    "offers": {
      "@type": "Offer",
      "url": "https://axon-nap.de/",
      "priceCurrency": "EUR",
      "price": "59.90",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-amber-500/30 font-sans">
      <Helmet>
        <title>AXON – Verspannungen & Schmerzen selbst lösen | Neuro-Athletic Protocol</title>
        <meta name="description" content="Kein Physio. Keine Wartezeit. AXON gibt dir das Protokoll, das Physios anwenden – zum selbst machen." />
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      </Helmet>

      {/* Navigation */}
       <nav className="fixed w-full z-50 py-3 md:py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
         <div className="max-w-7xl mx-auto px-3 md:px-6 flex justify-between items-center">
           <div className="flex flex-col items-center">
             <img
               src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
               alt="AXON"
               className="h-6 md:h-8 lg:h-10 object-contain"
               loading="lazy"
               width="100"
               height="40"
             />
             <span className="hidden md:block text-[10px] text-white font-medium tracking-widest mt-0.5">Neuro-Athletic-Protocol</span>
           </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            <a href="#audit" className="hover:text-cyan-400 transition-colors">System-Audit</a>
            <a href="#system" className="hover:text-cyan-400 transition-colors">Das System</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Preis</a>
            <Link to={createPageUrl('Wissen')} className="hover:text-cyan-400 transition-colors">Wissen</Link>
            <Link to={createPageUrl('FAQ')} className="hover:text-cyan-400 transition-colors">FAQ</Link>
            {user && <Link to={createPageUrl('Dashboard')} className="hover:text-cyan-400 transition-colors">Dashboard</Link>}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {user ? (
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full px-3 sm:px-6 text-[9px] sm:text-xs uppercase tracking-wide">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-bold rounded-full px-2 sm:px-5 text-[9px] sm:text-xs uppercase tracking-wide transition-all duration-300 whitespace-nowrap"
                >
                  Login
                </Button>
                <Button
                  onClick={handleFunnelClick}
                  className="bg-white hover:bg-cyan-50 text-black font-bold rounded-full px-3 sm:px-6 text-[9px] sm:text-xs uppercase tracking-wide transition-all duration-300 whitespace-nowrap"
                >
                  Plan
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
          <a href="#audit" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">System-Audit</a>
          <a href="#system" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">Das System</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-slate-300">Preis</a>
          <Link to={createPageUrl('Wissen')} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-cyan-400">Wissen</Link>
          <Link to={createPageUrl('FAQ')} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest text-cyan-400">FAQ</Link>
          <div className="h-px bg-white/10 w-full my-1" />
          <Link to={createPageUrl('Imprint')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Impressum</Link>
          <Link to={createPageUrl('Privacy')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">Datenschutz</Link>
          <Link to={createPageUrl('Terms')} onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-slate-500">AGB</Link>
        </div>
      )}

      {/* MODULE 1: Hero */}
      <HeroSection onCtaClick={handleFunnelClick} />

      {/* MODULE 2: Problem Agitation */}
      <PainAgitationSection onFunnelClick={handleFunnelClick} />

      {/* MODULE 3: Interaktives System-Audit */}
      <SystemAuditSection onCtaClick={handleFunnelClick} />

      {/* MODULE 4: Das System (3 Säulen) */}
      <Suspense fallback={<LazyFallback />}>
        <ThreeSystemSection />
      </Suspense>

      {/* MODULE 5: Audio-Coaching USP */}
      <Suspense fallback={<LazyFallback />}>
        <AudioCoachSection onCtaClick={handleFunnelClick} />
      </Suspense>

      {/* MODULE 6: Founder Story + Social Proof */}
      <Suspense fallback={<LazyFallback />}>
        <FounderStorySection onCtaClick={handleFunnelClick} />
      </Suspense>

      {/* MODULE 7: Fairness / Pricing */}
      <Suspense fallback={<LazyFallback />}>
        <FairnessSection onCtaClick={handleSelectOption} />
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center items-center gap-6 mb-6 text-xs font-bold uppercase tracking-widest text-slate-500 flex-wrap">
            <Link to={createPageUrl('Wissen')} className="hover:text-cyan-400 transition-colors">Wissen</Link>
            <span>·</span>
            <Link to={createPageUrl('FAQ')} className="hover:text-cyan-400 transition-colors">FAQ</Link>
            <span>·</span>
            <Link to={createPageUrl('Imprint')} className="hover:text-cyan-400 transition-colors">Impressum</Link>
            <span>·</span>
            <Link to={createPageUrl('Privacy')} className="hover:text-cyan-400 transition-colors">Datenschutz</Link>
            <span>·</span>
            <Link to={createPageUrl('Terms')} className="hover:text-cyan-400 transition-colors">AGB</Link>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">
            AXON<span className="lowercase" style={{ color: '#398bf7' }}>-nap</span> · Intelligent Training System · Early Stage 2026
          </p>
        </div>
      </footer>
    </div>
  );
}