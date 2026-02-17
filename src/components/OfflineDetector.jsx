import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle offline/online state
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Trigger sync when coming back online
      await syncOfflineData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline data when coming back online
  const syncOfflineData = async () => {
    try {
      setIsSyncing(true);
      
      // Check if there are any pending operations in localStorage
      const pendingOps = JSON.parse(localStorage.getItem('pending_operations') || '[]');
      
      if (pendingOps.length > 0) {
        // Try to sync pending operations
        for (const op of pendingOps) {
          try {
            if (op.type === 'routine_history') {
              // This would sync in the actual app when routines are completed offline
              // For now, just mark as processed
              localStorage.removeItem('pending_operations');
            }
          } catch (error) {
            console.warn('Error syncing operation:', error);
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] glass rounded-xl border border-red-500/50 px-6 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-400" />
            <p className="text-sm font-medium text-slate-200">
              Offline-Modus • Viele Features sind begrenzt
            </p>
          </div>
        </motion.div>
      )}
      
      {isSyncing && !isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] glass-cyan rounded-xl border border-cyan-500/50 px-6 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-sm font-medium text-slate-200">
              Synchronisiere Daten...
            </p>
          </div>
        </motion.div>
      )}
      
      {!isOffline && !isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ delay: 2 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] glass rounded-xl border border-green-500/50 px-6 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-green-400" />
            <p className="text-sm font-medium text-slate-200">
              Zurück online
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}