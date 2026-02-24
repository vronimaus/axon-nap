import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useUser } from './useUser';
import { useQueryClient } from '@tanstack/react-query';

const TRIAL_DURATION_DAYS = 7;

export function useTrialStatus() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const queryClient = useQueryClient();
  
  const [trialStatus, setTrialStatus] = useState({
    isActive: false,
    daysRemaining: 0,
    isExpired: false,
    hasAccess: false
  });
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!isUserLoading) {
        setTrialStatus({ isActive: false, daysRemaining: 0, isExpired: false, hasAccess: false });
      }
      return;
    }

    // User hat bezahlt -> Zugriff
    if (user.has_paid) {
      setTrialStatus({ isActive: false, daysRemaining: 0, isExpired: false, hasAccess: true });
      return;
    }

    // Trial-Status checken
    if (user.trial_start_date) {
      const startDate = new Date(user.trial_start_date);
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
      // Neuer User -> Trial starten, avoiding infinite loops
      if (!isUpdating) {
        setIsUpdating(true);
        base44.auth.updateMe({ trial_start_date: new Date().toISOString() })
          .then(() => {
             queryClient.invalidateQueries({ queryKey: ['user'] });
             setIsUpdating(false);
          })
          .catch(e => {
             console.error('Error starting trial:', e);
             setIsUpdating(false);
          });
      }
      
      setTrialStatus({
        isActive: true,
        daysRemaining: TRIAL_DURATION_DAYS,
        isExpired: false,
        hasAccess: true
      });
    }
  }, [user, isUserLoading, isUpdating, queryClient]);

  return {
    user,
    isLoading: isUserLoading || isUpdating,
    ...trialStatus
  };
}