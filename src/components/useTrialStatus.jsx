import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const TRIAL_DURATION_DAYS = 7;

export function useTrialStatus() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState({
    isActive: false,
    daysRemaining: 0,
    isExpired: false,
    hasAccess: false
  });

  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setIsLoading(false);
          return;
        }

        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        // User hat bezahlt -> Zugriff
        if (currentUser.has_paid) {
          setTrialStatus({
            isActive: false,
            daysRemaining: 0,
            isExpired: false,
            hasAccess: true
          });
          setIsLoading(false);
          return;
        }

        // Trial-Status checken
        if (currentUser.trial_start_date) {
          const startDate = new Date(currentUser.trial_start_date);
          const now = new Date();
          const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
          const isTrialActive = daysRemaining > 0;

          setTrialStatus({
            isActive: isTrialActive,
            daysRemaining,
            isExpired: !isTrialActive,
            hasAccess: isTrialActive
          });
        } else {
          // Neuer User -> Trial starten
          await base44.auth.updateMe({
            trial_start_date: new Date().toISOString()
          });

          setTrialStatus({
            isActive: true,
            daysRemaining: TRIAL_DURATION_DAYS,
            isExpired: false,
            hasAccess: true
          });
        }
      } catch (e) {
        // Ignoriere erwartete Auth-Fehler bei nicht eingeloggten Usern
        if (!e.message?.includes('Authentication required') && e.status !== 401) {
          console.error('Error checking trial status:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkTrialStatus();
  }, []);

  return {
    user,
    isLoading,
    ...trialStatus
  };
}