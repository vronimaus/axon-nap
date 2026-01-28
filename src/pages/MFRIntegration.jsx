import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MFRIntegrationFlow from '../components/mfr/MFRIntegrationFlow';
import DemoPaywall from '../components/demo/DemoPaywall';
import { useDemoTimer } from '../components/demo/useDemoTimer';

export default function MFRIntegration() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isDemoExpired } = useDemoTimer();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />;
  }

  // Show paywall if user not paid (except admin)
  if (!isLoading && user && !user.has_paid && user.role !== 'admin') {
    return <DemoPaywall />;
  }

  if (isDemoExpired) {
    return <DemoPaywall />;
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Session ID erforderlich</h1>
          <p className="text-slate-400 mt-2">Bitte starte vom Detective Chat aus</p>
        </div>
      </div>
    );
  }

  return <MFRIntegrationFlow diagnosisSessionId={sessionId} />;
}