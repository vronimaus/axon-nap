import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ExerciseLockedPaywall({ exerciseName, onClose }) {
  const handleStartTrial = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">"{exerciseName}" gesperrt</h2>
            <p className="text-sm text-slate-400">Unlock mit Vollzugriff</p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <p className="text-sm text-slate-300 font-medium">
            Du siehst deinen kompletten Rehab-Plan, kannst aber von jeder Kategorie nur die erste Übung machen.
          </p>
          <p className="text-xs text-slate-500">
            Mit Vollzugriff spielst du alle Übungen — so holst du wirklich alles aus dem Plan raus.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Button
            onClick={handleStartTrial}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold py-6 text-base"
          >
            <Zap className="w-5 h-5 mr-2" />
            Jetzt freischalten — 59€
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
          >
            Schließen
          </Button>
        </div>

        {/* Trust Signal */}
        <p className="text-xs text-slate-500 text-center">
          30-Tage Geld-zurück-Garantie
        </p>
      </div>
    </div>
  );
}