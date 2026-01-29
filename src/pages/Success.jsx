import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Success() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('register'); // 'register' oder 'login'
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session_id');
    
    // Kein Session-ID = direkt zur Landing (User darf nicht ohne Zahlung hier sein)
    if (!session) {
      window.location.href = createPageUrl('Landing');
      return;
    }
    
    setSessionId(session);
    setIsLoading(false);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    setIsSubmitting(true);
    try {
      // Registriere User mit Passwort
      await base44.auth.register({
        email,
        password,
        full_name: fullName
      });

      // Auto-Login
      await base44.auth.login(email, password);
      
      toast.success('Account erstellt! Willkommen bei AXON.');
      
      // Webhook wird den User automatisch als paid markieren
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Fehler bei der Registrierung');
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email und Passwort erforderlich');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.login(email, password);
      
      toast.success('Willkommen zurück!');
      
      // Webhook wird den User automatisch als paid markieren
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login fehlgeschlagen');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Zahlung erfolgreich!</h1>
          <p className="text-slate-400">Erstelle jetzt dein AXON Account</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl border border-cyan-500/20 p-8 mb-6"
        >
          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Vollständiger Name
                </label>
                <Input
                  type="text"
                  placeholder="z.B. Max Mustermann"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-slate-900 border-slate-700"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="deine@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-slate-900 border-slate-700"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Passwort
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mindestens 8 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-slate-900 border-slate-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Account wird erstellt...
                  </>
                ) : (
                  'Account erstellen'
                )}
              </Button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">oder</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setStep('login');
                  setPassword('');
                  setFullName('');
                }}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                Ich habe bereits einen Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="deine@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-slate-900 border-slate-700"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Passwort
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Dein Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="bg-slate-900 border-slate-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingeloggt...
                  </>
                ) : (
                  'Einloggen'
                )}
              </Button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">oder</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setStep('register');
                  setPassword('');
                  setFullName('');
                }}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                Neuen Account erstellen
              </Button>
            </form>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-400"
        >
          <p>Nach dem Login bekommst du sofort Zugriff auf AXON.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}