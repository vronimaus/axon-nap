import { useUser } from './useUser';

const TRIAL_DURATION_DAYS = 7;

export function useTrialStatus() {
  const { data: user, isLoading: isUserLoading } = useUser();

  // Derive state synchronously during render to avoid race conditions and infinite loops
  let trialStatus = {
    isActive: false,
    daysRemaining: 0,
    isExpired: false,
    hasAccess: false
  };

  if (user) {
    const now = new Date();
    if (user.role === 'admin') {
      trialStatus = { isActive: false, daysRemaining: 0, isExpired: false, hasAccess: true };
    } else if (user.has_paid) {
      trialStatus = { isActive: false, daysRemaining: 0, isExpired: false, hasAccess: true };
    } else if (user.trial_start_date) {
      const startDate = new Date(user.trial_start_date);
      const now = new Date();
      const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
      const isTrialActive = daysRemaining > 0;

      trialStatus = {
        isActive: isTrialActive,
        daysRemaining,
        isExpired: !isTrialActive,
        hasAccess: isTrialActive
      };
    } else {
      // New user: auto-start 7-day trial based on account creation date
      const createdDate = user.created_date ? new Date(user.created_date) : new Date();
      const daysElapsed = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
      const isTrialActive = daysRemaining > 0;
      trialStatus = {
        isActive: isTrialActive,
        daysRemaining,
        isExpired: !isTrialActive,
        hasAccess: isTrialActive
      };
    }
  }

  return {
    user,
    isLoading: isUserLoading,
    ...trialStatus
  };
}