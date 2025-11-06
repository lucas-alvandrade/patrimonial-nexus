import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, PendingOperation } from './offlineStorage';
import { toast } from 'sonner';

class SyncManager {
  private isSyncing = false;

  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    console.log('Starting synchronization...');

    try {
      const operations = await offlineStorage.getPendingOperations();
      
      if (operations.length === 0) {
        console.log('No pending operations to sync');
        this.isSyncing = false;
        return;
      }

      toast.info(`Sincronizando ${operations.length} operação(ões)...`);

      // Sort by timestamp to maintain order
      operations.sort((a, b) => a.timestamp - b.timestamp);

      let successCount = 0;
      let errorCount = 0;

      for (const operation of operations) {
        try {
          await this.executePendingOperation(operation);
          await offlineStorage.removePendingOperation(operation.id);
          successCount++;
        } catch (error) {
          console.error('Error syncing operation:', operation, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} operação(ões) sincronizada(s) com sucesso!`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} operação(ões) falharam na sincronização`);
      }

    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      this.isSyncing = false;
    }
  }

  private async executePendingOperation(operation: PendingOperation): Promise<void> {
    const { type, table, data } = operation;

    switch (type) {
      case 'insert':
        const { error: insertError } = await (supabase as any)
          .from(table)
          .insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { id, ...updateData } = data;
        const { error: updateError } = await (supabase as any)
          .from(table)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await (supabase as any)
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  async cacheTableData(table: string, data: any[]): Promise<void> {
    for (const item of data) {
      await offlineStorage.cacheData(table, item.id.toString(), item);
    }
  }

  async getCachedTableData(table: string): Promise<any[]> {
    return await offlineStorage.getAllCachedDataForTable(table);
  }
}

export const syncManager = new SyncManager();
