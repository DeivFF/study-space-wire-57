import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeOptions<T> {
  channel: string;
  table: string;
  filter: string;
  onMessage: (message: T) => void;
  fetchMessage?: (payload: any) => Promise<T | null>;
}

export function useRealtimeMessages<T>({
  channel,
  table,
  filter,
  onMessage,
  fetchMessage,
}: RealtimeOptions<T>) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter },
        async (payload) => {
          try {
            let message: T | null;
            if (fetchMessage) {
              message = await fetchMessage(payload);
            } else {
              message = (payload.new as unknown) as T;
            }
            if (message) {
              onMessage(message);
            }
          } catch (err: any) {
            console.error('Realtime message error:', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Realtime subscription failed'));
        }
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, table, filter, onMessage, fetchMessage]);

  return error;
}

export default useRealtimeMessages;
