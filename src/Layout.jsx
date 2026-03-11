import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, LogOut, User, Target, Activity, Settings, Menu, X, ArrowLeft, Zap } from 'lucide-react';
import CookieBanner from './components/CookieBanner';
import { useTrialStatus } from './components/useTrialStatus';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineDetector from './components/OfflineDetector';
import { HelmetProvider } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';

const ROOT_TABS = ['Dashboard', 'TrainingPlan', 'RehabPlan', 'Flow'];
const PAGES_WITHOUT_NAV = ['Landing', 'Success', 'Checkout', 'Login', 'RehabFunnel'];

// Map each tab to its "owned" pages so the tab stays highlighted
const TAB_OWNERSHIP = {
  Dashboard: ['Dashboard', 'DiagnosisChat', 'DiagnosisWizard', 'Discovery', 'Profile', 'HowToUse', 'AdminHub', 'AdminDiagnostics', 'DevNotes'],
  TrainingPlan: ['TrainingPlan', 'Performance'],
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

  // ── Dark mode detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ── Tab stack preservation ───────────────────────────────────────────────────
  // Persist the deepest page per tab so tapping a tab restores the last state.
  // Tapping the *active* tab resets it to root.
  useEffect(() => {
    if (PAGES_WITHOUT_NAV.includes(currentPageName)) return;
    const tab = getActiveTab(currentPageName);
    if (tab && !isRootTab(currentPageName)) {
      sessionStorage.setItem(`axon_tab_stack_${tab}`, currentPageName);
    }
  }, [currentPageName]); // eslint-disable-line react-hooks/exhaustive-deps

  const pagesWithoutNav = PAGES_WITHOUT_NAV;
  const showNav = !pagesWithoutNav.includes(currentPageName);
  const showBackButton = showNav && !isRootTab(currentPageName);
  
  const navItems = [
    { name: 'Command', icon: LayoutDashboard, page: 'Dashboard', color: 'cyan' },
    { name: 'Training', icon: Target, page: 'TrainingPlan', color: 'blue' },
    { name: 'Rehab', icon: Activity, page: 'RehabPlan', color: 'emerald' },
    { name: 'Flow', icon: Zap, page: 'Flow', color: 'purple' }
  ];

  const getColorClasses = (color) => {
    const colors = {
      cyan: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
      blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20',
      emerald: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
      purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
    };
    return colors[color] || colors.cyan;
  };

  const activeTab = getActiveTab(currentPageName);

  const handleTabClick = (page) => {
    const isCurrentTab = activeTab === page;
    if (isCurrentTab) {
      // Active tab tapped → reset to root, clear stack
      sessionStorage.removeItem(`axon_tab_stack_${page}`);
      if (currentPageName !== page) {
        window.location.href = createPageUrl(page);
      }
      // Already at root: do nothing (no reload)
      return;
    }
    // Different tab tapped → always go to root (no stack restore)
    // Stack restore caused confusion (e.g. DiagnosisChat re-opening unexpectedly)
    window.location.href = createPageUrl(page);
  };

  const publicNavItems = [
    { name: 'Wissen', page: 'Wissen' },
    { name: 'FAQ', page: 'Faq' },
    { name: 'Literatur', page: 'Literatur' }
  ];

  useEffect(() => {
    if (trialLoading) return;

    const handleAuthSideEffects = async () => {
      setIsChecking(true);
      try {
        if (!user) {
          // Nicht eingeloggt: nur auf Landing & Public Pages erlaubt
          const publicPages = ['Landing', 'Success', 'Checkout', 'Login', 'Imprint', 'Privacy', 'Terms', 'KnowledgeHub', 'KnowledgeHubArticle', 'FAQ', 'Glossary', 'Wissen', 'WissenArtikel', 'Faq', 'Glossar', 'RehabFunnel'];
          if (!publicPages.includes(currentPageName)) {
            window.location.href = createPageUrl('Landing');
          }
          setIsChecking(false);
          return;
        }

        const currentUser = user;

        // Redirect first-time users to onboarding (HowToUse)
        const onboardingSeen = localStorage.getItem('axon_howto_seen');
        if (!onboardingSeen && currentPageName !== 'HowToUse' && currentPageName !== 'Landing') {
          const profiles = await base44.entities.UserNeuroProfile.filter({ user_email: user.email });
          if (profiles.length === 0) {
            window.location.href = createPageUrl('HowToUse');
            return;
          } else {
            localStorage.setItem('axon_howto_seen', 'true');
          }
        }

        // Transfer onboarding data to user profile
        const onboardingStatus = localStorage.getItem('axon_onboarding_status');
        if (onboardingStatus === 'completed') {
          try {
            // Update user name if available
            const onboardingName = localStorage.getItem('axon_onboarding_name');
            if (onboardingName && !currentUser.full_name) {
              await base44.auth.updateMe({ full_name: onboardingName });
            }

            // Create or update UserNeuroProfile
            const fitnessGoals = JSON.parse(localStorage.getItem('axon_onboarding_fitness_goals') || '[]');
            const activityLevel = localStorage.getItem('axon_onboarding_activity_level');
            const currentPain = localStorage.getItem('axon_onboarding_current_pain');

            const existingProfiles = await base44.entities.UserNeuroProfile.filter({ user_email: currentUser.email });

            const profileData = {
              user_email: currentUser.email,
              fitness_goals: fitnessGoals,
              activity_level: activityLevel,
              profile_complete: false
            };

            // Add complaint history if pain was mentioned
            if (currentPain && currentPain.trim()) {
              profileData.complaint_history = [{
                date: new Date().toISOString().split('T')[0],
                location: currentPain,
                intensity: 5,
                description: 'Initial onboarding input',
                status: 'active'
              }];
            }

            if (existingProfiles.length > 0) {
              await base44.entities.UserNeuroProfile.update(existingProfiles[0].id, profileData);
            } else {
              await base44.entities.UserNeuroProfile.create(profileData);
            }

            // Clear onboarding data from localStorage
            localStorage.removeItem('axon_onboarding_name');
            localStorage.removeItem('axon_onboarding_fitness_goals');
            localStorage.removeItem('axon_onboarding_activity_level');
            localStorage.removeItem('axon_onboarding_current_pain');
            localStorage.removeItem('axon_onboarding_choice');
            localStorage.removeItem('axon_onboarding_status');
            // Remove legacy field
            localStorage.removeItem('last_daily_check_date');
          } catch (error) {
            console.error('Error transferring onboarding data:', error);
          }
        }

        // Prüfe ob nach Login eine Option gewählt wurde
        const selectedMode = localStorage.getItem('axon_selected_mode');
        if (selectedMode && currentPageName === 'Landing') {
          localStorage.removeItem('axon_selected_mode');

          if (selectedMode === 'trial' || selectedMode === 'direct') {
            // Zum Stripe Checkout weiterleiten (für Trial und Direct)
            try {
              const { data } = await base44.functions.invoke('createCheckoutSession', {
                mode: selectedMode,
                email: currentUser.email
              });
              if (data.url) {
                window.location.href = data.url;
                return;
              }
            } catch (error) {
              console.error('Checkout error:', error);
            }
          }
        }

        // Ohne Zahlung und ohne aktive Trial -> zurück zum Landing
        const publicPages = ['Landing', 'Success', 'Checkout', 'Login', 'Imprint', 'Privacy', 'Terms', 'KnowledgeHub', 'KnowledgeHubArticle', 'FAQ', 'Glossary', 'Wissen', 'WissenArtikel', 'Faq', 'Glossar', 'RehabFunnel'];
        if (!hasAccess && !publicPages.includes(currentPageName) && currentPageName !== 'HowToUse') {
          window.location.href = createPageUrl('Landing');
          return;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsChecking(false);
      }
    };
    handleAuthSideEffects();
  }, [user, trialLoading, hasAccess, currentPageName]);

  useEffect(() => {
    // Poll user status every 60 seconds to detect payment changes
    // Only poll on pages where user should be authenticated
    // Reduced frequency to prevent interference with user interactions
    if (!pagesWithoutNav.includes(currentPageName)) {
      const interval = setInterval(() => {
        if (!trialLoading) {
           queryClient.invalidateQueries({ queryKey: ['user'] });
        }
      }, 120000);
      return () => clearInterval(interval);
    }
  }, [currentPageName, trialLoading, queryClient]);



  const handleProfileClick = () => {
    window.location.href = createPageUrl('Profile');
  };
  
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Navigation - nur für eingeloggte User UND auf relevanten Pages */}
      {!isChecking && user && showNav && (
        <nav className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-500/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Back button (non-root pages) or Logo (root pages) */}
              {showBackButton ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors p-1 -ml-1"
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
                    />
                    <span className="text-[10px] text-white font-medium tracking-widest mt-1">Neuro-Athletic-Protocol</span>
                  </div>
                </Link>
              )}
              
              {/* Nav Links - Desktop only */}
                      <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                          const colorMap = { cyan: 'text-cyan-400', blue: 'text-blue-400', emerald: 'text-emerald-400', purple: 'text-purple-400' };
                          return (
                            <Link
                              key={item.page}
                              to={createPageUrl(item.page)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                currentPageName === item.page
                                  ? `${getColorClasses(item.color)} bg-opacity-20`
                                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                              }`}
                            >
                              <item.icon className={`w-4 h-4 ${colorMap[item.color]}`} />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>

                      {/* User Menu / Login */}
              {user ? (
                <div className="flex items-center gap-2">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => window.location.href = createPageUrl('AdminHub')}
                      className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800/50 transition-all"
                      title="Admin Hub"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={handleProfileClick}
                    className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                    title="Profil"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('stay_on_landing');
                      sessionStorage.removeItem('readiness_check_done');
                      base44.auth.logout(createPageUrl('Landing'));
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="ml-4 px-4 py-2 rounded-xl text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
      
      {/* Content with slide-in page transitions */}
      <main>
        {(isChecking && !pagesWithoutNav.includes(currentPageName)) ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-xs text-slate-500 tracking-widest uppercase font-mono">System lädt...</p>
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


      
      {/* Mobile Bottom Navigation - nur für eingeloggte User UND auf relevanten Pages */}
          {!isChecking && user && showNav && (
            <>
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-cyan-500/20 safe-area-pb">
                <div className="flex justify-around items-center px-2 py-3">
                  {navItems.map((item) => {
                    const colorMap = { cyan: 'text-cyan-400', blue: 'text-blue-400', emerald: 'text-emerald-400', purple: 'text-purple-400' };
                    return (
                      <button
                        key={item.page}
                        onClick={() => handleTabClick(item.page)}
                        title={item.name}
                        className={`flex items-center justify-center p-3 rounded-xl transition-all touch-target ${
                          activeTab === item.page
                            ? `${getColorClasses(item.color)}`
                            : 'text-slate-500 active:bg-slate-800/50'
                        }`}
                      >
                        <item.icon className={`w-6 h-6 ${colorMap[item.color]}`} />
                      </button>
                    );
                  })}

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      title="Mehr"
                      className="flex items-center justify-center p-3 rounded-xl transition-all text-slate-400 active:bg-slate-800/50"
                    >
                      {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    {mobileMenuOpen && (
                      <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-slate-600 overflow-hidden min-w-max bg-slate-800/95 backdrop-blur-md">
                        {publicNavItems.map((item) => (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors border-b border-slate-700 last:border-b-0"
                          >
                            {item.name}
                          </Link>
                        ))}
                        <div className="border-t border-slate-700">
                          <Link to={createPageUrl('Imprint')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors">Impressum</Link>
                          <Link to={createPageUrl('Privacy')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors border-t border-slate-700">Datenschutz</Link>
                          <Link to={createPageUrl('Terms')} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors border-t border-slate-700">AGB</Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </>
          )}

      {/* Footer */}
      <footer className="hidden md:block border-t border-cyan-500/20 glass mt-auto mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
            <div className="flex justify-center items-center gap-6 mb-8 text-xs font-bold uppercase tracking-widest text-slate-400 flex-wrap">
                <Link to={createPageUrl('Literatur')} className="hover:text-cyan-400 transition-colors">Literatur</Link>
                <span>•</span>
                <Link to={createPageUrl('Wissen')} className="hover:text-cyan-400 transition-colors">Wissen</Link>
                <span>•</span>
                <Link to={createPageUrl('FAQ')} className="hover:text-cyan-400 transition-colors">FAQ</Link>
                <span>•</span>
                <Link to={createPageUrl('Imprint')} className="hover:text-cyan-400 transition-colors">Impressum</Link>
                <span>•</span>
                <Link to={createPageUrl('Privacy')} className="hover:text-cyan-400 transition-colors">Datenschutz</Link>
                <span>•</span>
                <Link to={createPageUrl('Terms')} className="hover:text-cyan-400 transition-colors">AGB</Link>
            </div>
            
            <p className="text-slate-400 text-xs mb-4 uppercase tracking-[0.3em] font-bold">
                AXON<span style={{color: '#398bf7', textTransform: 'lowercase'}}>-nap</span> Intelligent Training System | Early Stage 2026
            </p>
            <p className="text-slate-500 text-[10px] max-w-xl mx-auto leading-relaxed">
                Datensicherheit nach DSGVO. On-Device KI-Verarbeitung. 
                Keine versteckten Gebühren. Besitze deine Gesundheit.
            </p>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Toast Notifications */}
      <Toaster position="top-center" theme="dark" />
      
      {/* Offline Detector */}
      <OfflineDetector />
      </div>
      </ErrorBoundary>
      </HelmetProvider>
      );
      }