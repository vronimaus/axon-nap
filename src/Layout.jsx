import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, LogOut, User, Target, Activity } from 'lucide-react';
import CookieBanner from './components/CookieBanner';
import { useTrialStatus } from './components/useTrialStatus';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const { isLoading: trialLoading, hasAccess } = useTrialStatus();
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Prüfe ob nach Login eine Option gewählt wurde
        const selectedMode = localStorage.getItem('axon_selected_mode');
        if (selectedMode && currentPageName === 'Landing') {
          localStorage.removeItem('axon_selected_mode');
          
          if (selectedMode === 'trial') {
            // Trial starten: trial_start_date setzen falls noch nicht gesetzt
            if (!currentUser.trial_start_date) {
              await base44.auth.updateMe({ trial_start_date: new Date().toISOString() });
            }
            // Zum Dashboard weiterleiten
            window.location.href = createPageUrl('Dashboard');
            return;
          } else if (selectedMode === 'direct') {
            // Zum Stripe Checkout weiterleiten
            try {
              const { data } = await base44.functions.invoke('createCheckoutSession', {
                mode: 'direct',
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

        // Prüfe ob User Zugriff hat (bezahlt oder aktive Trial)
        const hasTrialStart = currentUser?.trial_start_date;
        const daysElapsed = hasTrialStart ? Math.floor((new Date() - new Date(currentUser.trial_start_date)) / (1000 * 60 * 60 * 24)) : null;
        const isTrialActive = daysElapsed !== null && daysElapsed < 7;

        // Ohne Zahlung und ohne aktive Trial -> zurück zum Landing
        if (!currentUser?.has_paid && !isTrialActive && currentPageName !== 'Landing') {
          window.location.href = createPageUrl('Landing');
          return;
        }
      } catch (e) {
        // Not authenticated - that's fine for demo mode
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();

    // Poll user status every 10 seconds to detect payment changes
    // Only poll on pages where user should be authenticated
    // Reduced frequency to prevent interference with user interactions
    if (!pagesWithoutNav.includes(currentPageName)) {
      const interval = setInterval(async () => {
        try {
          const currentUser = await base44.auth.me();
          // Only update if user data actually changed to prevent unnecessary re-renders
          setUser(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(currentUser)) {
              return currentUser;
            }
            return prev;
          });
        } catch (e) {
          // Silent fail on polling - don't redirect on error
          console.warn('User status poll failed:', e.message);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
    }, [currentPageName]);

    // Pages ohne Navigation Header
    const pagesWithoutNav = ['Landing', 'Success', 'Checkout', 'Login'];
    const showNav = !pagesWithoutNav.includes(currentPageName);

    const navItems = [
              { name: 'Command', icon: LayoutDashboard, page: 'Dashboard' },
              { name: 'Training', icon: Target, page: 'TrainingPlan' },
              { name: 'Rehab', icon: Activity, page: 'RehabPlan' }
            ];

  const handleProfileClick = () => {
    window.location.href = createPageUrl('Profile');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation - nur für eingeloggte User UND auf relevanten Pages */}
      {!isChecking && user && showNav && (
        <nav className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-500/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
                  alt="AXON Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
                <div className="hidden xs:block">
                  <span className="font-bold text-cyan-400 text-base sm:text-lg tracking-tight">AXON</span>
                  <span className="text-xs text-slate-400 hidden sm:block -mt-1">Neuro-Athletic Protocol</span>
                </div>
              </Link>
              
              {/* Nav Links - Desktop only */}
                      <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              currentPageName === item.page
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>

                      {/* User Menu / Login */}
              {user ? (
                <div className="flex items-center gap-2">
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
                      localStorage.removeItem('last_daily_check_date');
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
      
      {/* Content */}
      <main>
        {children}
      </main>


      
      {/* Mobile Bottom Navigation - nur für eingeloggte User UND auf relevanten Pages */}
          {!isChecking && user && showNav && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t border-cyan-500/20 safe-area-pb">
              <div className="grid grid-cols-4 gap-1 px-2 py-2">
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all touch-target ${
                      currentPageName === item.page
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 active:bg-slate-800/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium truncate w-full text-center">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 glass mt-auto mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
            <p className="text-center sm:text-left">© 2026 AXON Protocol</p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Link to={createPageUrl('Imprint')} className="hover:text-cyan-400 transition-colors whitespace-nowrap">
                Impressum
              </Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-cyan-400 transition-colors whitespace-nowrap">
                Datenschutz
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-cyan-400 transition-colors whitespace-nowrap">
                AGB
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Toast Notifications */}
      <Toaster position="top-center" theme="dark" />
      </div>
      );
      }