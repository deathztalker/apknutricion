import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, recordService, patientService } from './supabase';
import { Alert } from 'react-native';

const SYNC_QUEUE_KEY = '@nutrihorror_sync_queue';

export interface SyncOperation {
  id: string;
  type: 'CREATE_PATIENT' | 'CREATE_RECORD';
  payload: any;
  timestamp: string;
}

export const syncService = {
  /**
   * Adds an operation to the local offline queue.
   */
  enqueueOperation: async (type: 'CREATE_PATIENT' | 'CREATE_RECORD', payload: any) => {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncOperation[] = queueStr ? JSON.parse(queueStr) : [];
      
      const newOp: SyncOperation = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      
      queue.push(newOp);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return newOp;
    } catch (error) {
      console.error('Error enqueueing operation:', error);
    }
  },

  /**
   * Gets the current offline queue.
   */
  getQueue: async (): Promise<SyncOperation[]> => {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  },

  /**
   * Attempts to flush the queue to Supabase.
   */
  flushQueue: async () => {
    try {
      const queue = await syncService.getQueue();
      if (queue.length === 0) return 0;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0; // Not logged in, can't sync

      let successCount = 0;
      let remainingQueue: SyncOperation[] = [];

      for (const op of queue) {
        let success = false;
        try {
          if (op.type === 'CREATE_PATIENT') {
            const { error } = await patientService.create({ ...op.payload, user_id: user.id } as any);
            if (!error) success = true;
          } else if (op.type === 'CREATE_RECORD') {
            const { error } = await recordService.create({ ...op.payload, user_id: user.id } as any);
            if (!error) success = true;
          }
        } catch (e) {
          console.error(`Sync error on operation ${op.id}:`, e);
        }

        if (success) {
          successCount++;
        } else {
          remainingQueue.push(op); // Keep it in the queue for next time
        }
      }

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
      return successCount;
    } catch (error) {
      console.error('Error flushing sync queue:', error);
      return 0;
    }
  },

  /**
   * Clear the entire queue (DANGER)
   */
  clearQueue: async () => {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  }
};
