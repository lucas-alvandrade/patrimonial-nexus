import { useState, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { offlineStorage } from '@/lib/offlineStorage';
import { syncManager } from '@/lib/syncManager';
import { supabase } from '@/integrations/supabase/client';

interface UseOfflineDataOptions {
  table: string;
  query?: any;
  dependencies?: any[];
}

export const useOfflineData = <T,>({ table, query, dependencies = [] }: UseOfflineDataOptions) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isOnline) {
        // Fetch from server
        let queryBuilder = (supabase as any).from(table).select('*');
        
        if (query) {
          queryBuilder = query(queryBuilder);
        }

        const { data: serverData, error } = await queryBuilder;
        
        if (error) throw error;
        
        if (serverData) {
          setData(serverData as T[]);
          // Cache the data
          await syncManager.cacheTableData(table, serverData);
        }
      } else {
        // Load from cache
        const cachedData = await syncManager.getCachedTableData(table);
        setData(cachedData as T[]);
      }
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      // Try to load from cache on error
      const cachedData = await syncManager.getCachedTableData(table);
      setData(cachedData as T[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOnline, ...dependencies]);

  const insert = async (newData: Partial<T>) => {
    if (isOnline) {
      const { data: insertedData, error } = await (supabase as any)
        .from(table)
        .insert(newData)
        .select()
        .single();
      
      if (error) throw error;
      
      setData([...data, insertedData as T]);
      return insertedData;
    } else {
      // Queue for sync
      await offlineStorage.addPendingOperation({
        type: 'insert',
        table,
        data: newData,
        timestamp: Date.now(),
      });
      
      // Optimistically update local state
      const tempId = `temp-${Date.now()}`;
      const tempData = { ...newData, id: tempId } as T;
      setData([...data, tempData]);
      return tempData;
    }
  };

  const update = async (id: any, updateData: Partial<T>) => {
    if (isOnline) {
      const { error } = await (supabase as any)
        .from(table)
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      setData(data.map(item => (item as any).id === id ? { ...item, ...updateData } : item));
    } else {
      // Queue for sync
      await offlineStorage.addPendingOperation({
        type: 'update',
        table,
        data: { id, ...updateData },
        timestamp: Date.now(),
      });
      
      // Optimistically update local state
      setData(data.map(item => (item as any).id === id ? { ...item, ...updateData } : item));
    }
  };

  const remove = async (id: any) => {
    if (isOnline) {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setData(data.filter(item => (item as any).id !== id));
    } else {
      // Queue for sync
      await offlineStorage.addPendingOperation({
        type: 'delete',
        table,
        data: { id },
        timestamp: Date.now(),
      });
      
      // Optimistically update local state
      setData(data.filter(item => (item as any).id !== id));
    }
  };

  return {
    data,
    loading,
    insert,
    update,
    remove,
    refetch: fetchData,
    isOnline,
  };
};
