// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface RoomTimerRow {
  room_id: string;
  user_id: string;
  state: 'idle' | 'running' | 'paused';
  started_at: string | null;
  accumulated_ms: number;
  updated_at: string;
}

interface RoomTimerProps {
  roomId: string;
  timer?: RoomTimerRow;
}

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

const RoomTimer: React.FC<RoomTimerProps> = ({ roomId, timer }) => {
  const { user } = useAuth();
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (!timer) {
        setDisplayMs(0);
        return;
      }
      const base = timer.accumulated_ms || 0;
      const extra =
        timer.state === 'running' && timer.started_at
          ? Date.now() - new Date(timer.started_at).getTime()
          : 0;
      setDisplayMs(base + extra);
    };
    calc();
    if (timer?.state === 'running') {
      const interval = setInterval(calc, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const startOrResume = async () => {
    if (!user) return;
    await (supabase as any).from('study_room_timers').upsert({
      room_id: roomId,
      user_id: user.id,
      state: 'running',
      started_at: new Date().toISOString(),
      accumulated_ms: timer?.accumulated_ms || 0,
      event_id: crypto.randomUUID(),
    });
    await (supabase as any).from('study_room_events').insert({
      room_id: roomId,
      event_id: crypto.randomUUID(),
      type: 'timer_started',
      payload: { user_id: user.id },
    });
  };

  const pause = async () => {
    if (!user || !timer) return;
    const elapsed = timer.started_at
      ? Date.now() - new Date(timer.started_at).getTime()
      : 0;
    const newAccum = (timer.accumulated_ms || 0) + elapsed;
    await (supabase as any).from('study_room_timers').upsert({
      room_id: roomId,
      user_id: user.id,
      state: 'paused',
      started_at: null,
      accumulated_ms: newAccum,
      event_id: crypto.randomUUID(),
    });
    await (supabase as any).from('study_room_events').insert({
      room_id: roomId,
      event_id: crypto.randomUUID(),
      type: 'timer_paused',
      payload: { user_id: user.id },
    });
  };

  const reset = async () => {
    if (!user) return;
    await (supabase as any).from('study_room_timers').upsert({
      room_id: roomId,
      user_id: user.id,
      state: 'idle',
      started_at: null,
      accumulated_ms: 0,
      event_id: crypto.randomUUID(),
    });
    await (supabase as any).from('study_room_events').insert({
      room_id: roomId,
      event_id: crypto.randomUUID(),
      type: 'timer_reset',
      payload: { user_id: user.id },
    });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-3xl font-mono">{formatTime(displayMs)}</div>
      <div className="flex gap-2">
        {timer?.state === 'running' ? (
          <Button onClick={pause} variant="outline">
            Pausar
          </Button>
        ) : (
          <Button onClick={startOrResume} variant="outline">
            Iniciar
          </Button>
        )}
        <Button onClick={reset} variant="secondary" disabled={displayMs === 0}>
          Resetar
        </Button>
      </div>
    </div>
  );
};

export default RoomTimer;
