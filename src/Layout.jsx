import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, LayoutDashboard, Compass, Trophy } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Command', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Detective', icon: Compass, page: 'DiagnosisWizard' },
    { name: 'Agent', icon: Activity, page: 'DiagnosisChat' },
    { name: 'Goals', icon: Trophy, page: 'Performance' }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
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
            <div className="flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentPageName === item.page
                      ? 'bg-cyan-500/20 text-cyan-400 neuro-glow'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-cyan-300'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-cyan-500/20 glass mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© 2026 AXON Protocol</p>
            <p className="text-xs">
              Powered by Anatomy Trains, Fascial Science & Z-Health Neuro-Athletik
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}