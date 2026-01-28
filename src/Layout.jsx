import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, LayoutDashboard, Compass, Trophy, LogOut, User } from 'lucide-react';
import CookieBanner from './components/CookieBanner';
import { useDemoTimer } from './components/demo/useDemoTimer';
import DemoTimer from './components/demo/DemoTimer';
import DemoPaywall from './components/demo/DemoPaywall';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Toaster } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const { isDemoExpired, isLoading: demoLoading, formattedTime } = useDemoTimer();
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not authenticated - that's fine for demo mode
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);
  const navItems = [
    { name: 'Command', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Detective', icon: Compass, page: 'DiagnosisWizard' },
    { name: 'Agent', icon: Activity, page: 'DiagnosisChat' },
    { name: 'Goals', icon: Trophy, page: 'Performance' }
  ];

  const handleProfileClick = () => {
    window.location.href = createPageUrl('Profile');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation - nur für eingeloggte User */}
      {!isChecking && user && (
        <nav className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-500/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69790ebfa6f94c6c3f1450bc/afa60dd62_AXONLogo.png"
                  alt="AXON Logo"
                  className="w-10 h-10 object-contain"
                />
                <div className="hidden sm:block">
                  <span className="font-bold text-cyan-400 text-lg tracking-tight">AXON</span>
                  <span className="text-xs text-slate-400 block -mt-1">Neuro-Athletic Protocol</span>
                </div>
              </Link>
              
              {/* Nav Links */}

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
                    onClick={() => base44.auth.logout()}
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

      {/* Global Demo Timer - nur wenn nicht admin und nicht bezahlt */}
          {user && !isChecking && !user?.has_paid && user?.role !== 'admin' && (
            <DemoTimer formattedTime={formattedTime} isLoading={demoLoading} />
          )}

          {/* Demo Paywall Overlay */}
          <AnimatePresence>
            {user && !isChecking && isDemoExpired && !user?.has_paid && user?.role !== 'admin' && <DemoPaywall />}
          </AnimatePresence>
      
      {/* Footer */}
      <footer className="border-t border-cyan-500/20 glass mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© 2026 AXON Protocol</p>
            <div className="flex gap-4">
              <Link to={createPageUrl('Imprint')} className="hover:text-cyan-400 transition-colors">
                Impressum
              </Link>
              <Link to={createPageUrl('Privacy')} className="hover:text-cyan-400 transition-colors">
                Datenschutz
              </Link>
              <Link to={createPageUrl('Terms')} className="hover:text-cyan-400 transition-colors">
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