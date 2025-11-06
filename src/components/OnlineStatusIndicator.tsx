import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncManager } from '@/lib/syncManager';
import { toast } from 'sonner';

export const OnlineStatusIndicator = () => {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleSync = async () => {
      if (isOnline && !isSyncing) {
        setIsSyncing(true);
        try {
          await syncManager.syncPendingOperations();
        } catch (error) {
          console.error('Sync error:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener('online-sync', handleSync);

    return () => {
      window.removeEventListener('online-sync', handleSync);
    };
  }, [isOnline, isSyncing]);

  useEffect(() => {
    if (!isOnline) {
      toast.warning('Trabalhando offline - Dados serão sincronizados quando a conexão retornar', {
        duration: 5000,
      });
    }
  }, [isOnline]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {isSyncing ? 'Sincronizando...' : 'Online'}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Offline</span>
        </>
      )}
    </div>
  );
};
