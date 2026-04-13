import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, LogOut, User, Activity, Settings, Menu, X, ArrowLeft, Zap } from 'lucide-react';
import CookieBanner from './components/CookieBanner';
import { useTrialStatus } from './components/useTrialStatus';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineDetector from './components/OfflineDetector';
import { HelmetProvider } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';

const ROOT_TABS = ['Dashboard', 'RehabPlan', 'Flow'];
const PAGES_WITHOUT_NAV = ['Landing', 'Success', 'Checkout', 'Login'];

const TAB_OWNERSHIP = {
  Dashboard: ['Dashboard', 'DiagnosisChat', 'DiagnosisWizard', 'Discovery', 'Profile', 'HowToUse', 'AdminHub', 'AdminDiagnostics', 'DevNotes'],
  FitnessSnacks: ['FitnessSnacks'],
  RehabPlan: ['RehabPlan'],
  Flow: ['Flow', 'FlowRoutines'],
};

function getActiveTab(pageName) {
  for (const [tab, pages] of Object.entries(TAB_OWNERSHIP)) {
    if (pages.includes(pageName)) return tab;
  }
  return null;
}

function isRootTab(pageName) {
  return ROOT_TABS.includes(pageName);
}

export default function Layout({ children, currentPageName }) {
  const { user, isLoading: trialLoading, hasAccess } = useTrialStatus();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (PAGES_WITHOUT_NAV.includes(currentPageName)) return;
    const tab = getActiveTab(currentPageName);
    if (tab && !isRootTab(currentPageName)) {
      sessionStorage.setItem(`axon_tab_stack_${tab}`, currentPageName);
    }
  }, [currentPageName]);

  const pagesWithoutNav = PAGES_WITHOUT_NAV;
  const showNav = !pagesWithoutNav.includes(currentPageName);
  const showBackButton = showNav && !isRootTab(currentPageName);

  const navItems = [
    { name: 'Command', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Snacks',  icon: Zap,             page: 'FitnessSnacks' },
    { name: 'Rehab',   icon: Activity,         page: 'RehabPlan' },
    { name: 'Flow',    icon: Zap,              page: 'Flow' },
  ];

  const activeTab = getActiveTab(currentPageName);

  const handleTabClick = (page) => {
    const isCurrentTab = activeTab === page;
    if (isCurrentTab) {
      sessionStorage.removeItem(`axon_tab_stack_${page}`);
      if (currentPageName !== page) window.location.href = createPageUrl(page);
      return;
    }
    window.location.href = createPageUrl(page);
  };

  const publicNavItems = [
    { name: 'Wissen',   page: 'Wissen' },
    { name: 'FAQ',      page: 'Faq' },
    { name: 'Literatur',page: 'Literatur' },
  ];

  const PUBLIC_PAGES = ['Landing', 'Success', 'Checkout', 'Login', 'Imprint', 'Privacy', 'Terms', 'KnowledgeHub', 'KnowledgeHubArticle', 'FAQ', 'Glossary', 'Wissen', 'WissenArtikel', 'Faq', 'Glossar'];
  const isBuilderPreview = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (trialLoading) return;
    const handleAuthSideEffects = async () => {
      setIsChecking(true);
      try {
        if (!user) {
          if (isBuilderPreview) { setIsChecking(false); return; }
          if (!PUBLIC_PAGES.includes(currentPageName)) window.location.href = createPageUrl('Landing');
          setIsChecking(false);
          return;
        }
        const currentUser = user;
        const onboardingSeen = localStorage.getItem('axon_howto_seen');
        if (!onboardingSeen && currentPageName !== 'HowToUse' && currentPageName !== 'Landing') {
          const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
          if (profiles.length === 0) { window.location.href = createPageUrl('HowToUse'); return; }
          else localStorage.setItem('axon_howto_seen', 'true');
        }
        const onboardingStatus = localStorage.getItem('axon_onboarding_status');
        if (onboardingStatus === 'completed') {
          try {
            const onboardingName = localStorage.getItem('axon_onboarding_name');
            if (onboardingName && !currentUser.full_name) await base44.auth.updateMe({ full_name: onboardingName });
            const fitnessGoals = JSON.parse(localStorage.getItem('axon_onboarding_fitness_goals') || '[]');
            const activityLevel = localStorage.getItem('axon_onboarding_activity_level');
            const currentPain = localStorage.getItem('axon_onboarding_current_pain');
            const existingProfiles = await base44.entities.UserNeuroProfile.filter({ user_email: currentUser.email });
            const profileData = { user_email: currentUser.email, fitness_goals: fitnessGoals, activity_level: activityLevel, profile_complete: false };
            if (currentPain && currentPain.trim()) profileData.complaint_history = [{ date: new Date().toISOString().split('T')[0], location: currentPain, intensity: 5, description: 'Initial onboarding input', status: 'active' }];
            if (existingProfiles.length > 0) await base44.entities.UserNeuroProfile.update(existingProfiles[0].id, profileData);
            else await base44.entities.UserNeuroProfile.create(profileData);
            ['axon_onboarding_name','axon_onboarding_fitness_goals','axon_onboarding_activity_level','axon_onboarding_current_pain','axon_onboarding_choice','axon_onboarding_status','last_daily_check_date'].forEach(k => localStorage.removeItem(k));
          } catch (error) { console.error('Error transferring onboarding data:', error); }
        }
        const selectedMode = localStorage.getItem('axon_selected_mode');
        if (selectedMode && currentPageName === 'Landing') {
          localStorage.removeItem('axon_selected_mode');
          if (selectedMode === 'trial' || selectedMode === 'direct') {
            try {
              const { data } = await base44.functions.invoke('createCheckoutSession', { mode: selectedMode, email: currentUser.email });
              if (data.url) { window.location.href = data.url; return; }
            } catch (error) { console.error('Checkout error:', error); }
          }
        }
        if (!hasAccess && !PUBLIC_PAGES.includes(currentPageName) && currentPageName !== 'HowToUse' && !isBuilderPreview) {
          window.location.href = createPageUrl('Landing');
          return;
        }
      } catch (e) { console.error(e); }
      finally { setIsChecking(false); }
    };
    handleAuthSideEffects();
  }, [user, trialLoading, hasAccess, currentPageName]);

  useEffect(() => {
    if (!pagesWithoutNav.includes(currentPageName)) {
      const interval = setInterval(() => {
        if (!trialLoading) queryClient.invalidateQueries({ queryKey: ['user'] });
      }, 120000);
      return () => clearInterval(interval);
    }
  }, [currentPageName, trialLoading, queryClient]);

  const handleProfileClick = () => { window.location.href = createPageUrl('Profile'); };

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#111111]">

          {/* ── Desktop + Mobile Top Nav ── */}
          {!isChecking && user && showNav && (
            <nav className="sticky top-0 z-50 bg-[#111111] border-b border-white/[0.06]">
              <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">

                  {/* Left: back button or logo */}
                  {showBackButton ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors p-1 -ml-1"
                        aria-label="Zurück"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden xs:inline">Zurück</span>
                      </button>
                      <span className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs">
                        {currentPageName}
                      </span>
                    </div>
                  ) : (
                    <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 sm:gap-3">
                      <div className="flex flex-col items-center">
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/f960cb731_AxonnapLogo500x180Neu.png"
                          alt="AXON"
                          className="h-8 sm:h-10 object-contain mt-1"
                          loading="lazy"
                          width="100"
                          height="40"
                        />
                        <span className="text-[10px] text-zinc-500 font-medium tracking-widest mt-1">Neuro-Athletic-Protocol</span>
                      </div>
                    </Link>
                  )}

                  {/* Center: Desktop nav links */}
                  <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          activeTab === item.page
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Right: user actions */}
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && (
                      <button
                        onClick={() => window.location.href = createPageUrl('AdminHub')}
                        className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                        title="Admin Hub"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={handleProfileClick}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                      title="Profil"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { localStorage.removeItem('stay_on_landing'); sessionStorage.removeItem('readiness_check_done'); base44.auth.logout(createPageUrl('Landing')); }}
                      className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              </div>
            </nav>
          )}

          {/* ── Page Content ── */}
          <main>
            {(isChecking && !pagesWithoutNav.includes(currentPageName)) ? (
              <div className="min-h-screen flex items-center justify-center bg-[#111111]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                  <p className="text-xs text-zinc-600 tracking-widest uppercase font-mono">System lädt…</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPageName}
                  initial={showBackButton ? { opacity: 0, x: 24 } : { opacity: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={showBackButton ? { opacity: 0, x: -12 } : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          {/* ── Mobile Bottom Nav ── */}
          {!isChecking && user && showNav && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur border-t border-white/[0.06] safe-area-pb">
              <div className="flex justify-around items-center px-2 py-3">
                {navItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleTabClick(item.page)}
                    title={item.name}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all touch-target ${
                      activeTab === item.page
                        ? 'text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[9px] font-medium">{item.name}</span>
                  </button>
                ))}

                {/* More menu */}
                <div className="relative">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    title="Mehr"
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-zinc-600"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    <span className="text-[9px] font-medium">Mehr</span>
                  </button>

                  {mobileMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/[0.08] overflow-hidden min-w-max bg-zinc-900/95 backdrop-blur-md">
                      {publicNavItems.map((item) => (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-white/[0.05] last:border-b-0"
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t border-white/[0.05]">
                        <Link to={createPageUrl('Imprint')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors">Impressum</Link>
                        <Link to={createPageUrl('Privacy')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors border-t border-white/[0.05]">Datenschutz</Link>
                        <Link to={createPageUrl('Terms')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors border-t border-white/[0.05]">AGB</Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          {/* ── Footer ── */}
          <footer className="hidden md:block border-t border-white/[0.06] mt-auto mb-16 md:mb-0">
            <div className="max-w-6xl mx-auto px-4 py-8 text-center">
              <div className="flex justify-center items-center gap-6 mb-6 text-xs font-medium tracking-widest text-zinc-600 flex-wrap">
                <Link to={createPageUrl('Literatur')} className="hover:text-zinc-400 transition-colors">Literatur</Link>
                <span>·</span>
                <Link to={createPageUrl('Wissen')} className="hover:text-zinc-400 transition-colors">Wissen</Link>
                <span>·</span>
                <Link to={createPageUrl('FAQ')} className="hover:text-zinc-400 transition-colors">FAQ</Link>
                <span>·</span>
                <Link to={createPageUrl('Imprint')} className="hover:text-zinc-400 transition-colors">Impressum</Link>
                <span>·</span>
                <Link to={createPageUrl('Privacy')} className="hover:text-zinc-400 transition-colors">Datenschutz</Link>
                <span>·</span>
                <Link to={createPageUrl('Terms')} className="hover:text-zinc-400 transition-colors">AGB</Link>
              </div>
              <p className="text-zinc-700 text-[10px] uppercase tracking-[0.3em] font-medium">
                AXON-nap · Neuro-Athletic-Protocol · 2026
              </p>
            </div>
          </footer>

          <CookieBanner />
          <Toaster position="top-center" theme="dark" />
          <OfflineDetector />
        </div>
      </ErrorBoundary>
    </HelmetProvider>
  );
}