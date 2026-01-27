import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Activity, LayoutDashboard, Compass } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Diagnose', icon: Compass, page: 'DiagnosisWizard' }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-slate-800">Neuro-Fascial</span>
                <span className="text-xs text-slate-500 block -mt-1">Diagnosis Tool</span>
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
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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
      <footer className="border-t border-slate-100 bg-white/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2024 Neuro-Fascial Diagnosis Tool</p>
            <p className="text-xs">
              Basierend auf Thomas Myers (Anatomy Trains), Robert Schleip (Faszienforschung) & Z-Health Neuro-Athletik
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}