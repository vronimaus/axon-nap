import { useEffect, useState } from 'react';

const DEMO_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEMO_START_TIME_KEY = 'axon_demo_start_time';

// Helper to safely access storage (fallback for incognito mode)
const getStorageValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return sessionStorage.getItem(key);
  }
};

const setStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    sessionStorage.setItem(key, value);
  }
};

// Global fallback for incognito mode
let demoStartTimeGlobal = null;

export function useDemoTimer() {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isDemoExpired, setIsDemoExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if demo already completed (paid)
    if (getStorageValue('demo_completed') === 'true') {
      setIsDemoExpired(false);
      setIsLoading(false);
      return;
    }

    // Initialize demo timer on component mount
    let startTime = getStorageValue(DEMO_START_TIME_KEY);
    const now = Date.now();

    if (!startTime && demoStartTimeGlobal) {
      startTime = demoStartTimeGlobal.toString();
    }

    if (!startTime) {
      // First visit - start the demo
      demoStartTimeGlobal = now;
      setStorageValue(DEMO_START_TIME_KEY, now.toString());
      setTimeRemaining(DEMO_DURATION_MS);
      setIsDemoExpired(false);
      setIsLoading(false);
      return;
    }

    const elapsed = now - parseInt(startTime);
    const remaining = Math.max(0, DEMO_DURATION_MS - elapsed);

    if (remaining === 0) {
      setIsDemoExpired(true);
      setTimeRemaining(0);
    } else {
      setTimeRemaining(remaining);
    }

    setIsLoading(false);

    // Update remaining time every second
    const interval = setInterval(() => {
      const currentElapsed = Date.now() - parseInt(startTime);
      const currentRemaining = Math.max(0, DEMO_DURATION_MS - currentElapsed);

      if (currentRemaining === 0) {
        setIsDemoExpired(true);
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(currentRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    isDemoExpired,
    isLoading,
    formattedTime: formatTime(timeRemaining),
    startNewDemo: () => {
      localStorage.setItem(DEMO_START_TIME_KEY, Date.now().toString());
      setTimeRemaining(DEMO_DURATION_MS);
      setIsDemoExpired(false);
    }
  };
}