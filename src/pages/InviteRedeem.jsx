import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function InviteRedeem() {
  const [step, setStep] = useState('input'); // input | loading | success | error
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  const handleRedeem = async () => {
    if (!code.trim()) return;

    if (!user) {
      // Not logged in → store code, redirect to login, come back
      localStorage.setItem('axon_invite_code', code.trim().toUpperCase());
      base44.auth.redirectToLogin(createPageUrl('InviteRedeem'));
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      const response = await base44.functions.invoke('redeemInviteCode', { code: code.trim() });

      if (response.data?.success) {
        setStep('success');
        base44.analytics.track({ eventName: 'invite_code_redeemed', properties: { success: true } });
        setTimeout(() => {
          window.location.href = createPageUrl('Dashboard');
        }, 2500);
      } else {
        throw new Error(response.data?.error || 'Ungültiger Code');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Fehler beim Einlösen');
      setStep('error');
    }
  };

  // Auto-redeem if code was stored before login
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem('axon_invite_code');
    if (stored) {
      localStorage.removeItem('axon_invite_code');
      setCode(stored);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Zap className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">AXON Premium</h1>
          <p className="text-slate-400 text-sm mt-1">Einladungscode einlösen</p>
        </div>

        <AnimatePresence mode="wait">

          {/* Input Step */}
          {(step === 'input' || step === 'error') && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {user && (
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300">
                  Eingeloggt als <span className="text-cyan-400 font-mono">{user.email}</span>
                </div>
              )}

              {!user && (
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                  <p className="text-sm text-slate-400">
                    Gib deinen Einladungscode ein. Wenn du noch nicht eingeloggt bist, wirst du danach kurz zum Login weitergeleitet.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    Einladungscode
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                    placeholder="z.B. AXON-BETA-2026"
                    className="bg-slate-900 border-slate-700 text-white font-mono text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 h-12 text-sm"
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                </div>
              </div>

              {step === 'error' && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <Button
                onClick={handleRedeem}
                disabled={!code.trim()}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold disabled:opacity-40"
              >
                {user ? 'Zugang freischalten' : 'Weiter zum Login'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <p className="text-center text-xs text-slate-600">
                Kein Code?{' '}
                <a href={createPageUrl('Landing')} className="text-cyan-500 hover:text-cyan-400 transition-colors">
                  Zur Startseite
                </a>
              </p>
            </motion.div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 space-y-4"
            >
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-300 text-sm">Code wird überprüft...</p>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white mb-1">Zugang freigeschaltet!</h2>
                <p className="text-slate-400 text-sm">Du hast vollen Zugriff auf AXON Premium. Weiterleitung zum Dashboard...</p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}