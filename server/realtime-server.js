import { createClient } from '@supabase/supabase-js';
import { WebSocketServer, WebSocket } from 'ws';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = Number(process.env.PORT || 4000);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const wss = new WebSocketServer({ port: PORT });

// Map of channel name to set of connected sockets
const channels = new Map();

// Cache of event IDs to avoid duplicates
const EVENT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const eventCache = new Map();

function cacheEvent(id) {
  if (eventCache.has(id)) {
    return false;
  }
  const timeout = setTimeout(() => {
    eventCache.delete(id);
  }, EVENT_TTL_MS);
  eventCache.set(id, timeout);
  return true;
}

function broadcast(channel, payload) {
  const subscribers = channels.get(channel);
  if (!subscribers) return;
  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'subscribe' && data.channel) {
        const channel = data.channel;
        if (!channels.has(channel)) {
          channels.set(channel, new Set());
        }
        channels.get(channel).add(ws);
        ws.on('close', () => {
          channels.get(channel).delete(ws);
        });
      }
    } catch {
      // ignore invalid messages
    }
  });
});

supabase
  .channel('public:study_room_events')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'study_room_events' },
    (payload) => {
      const event = payload.new;
      if (!event || !event.event_id || !event.room_id) return;
      if (!cacheEvent(event.event_id)) return;
      const channel = `room:${event.room_id}`;
      broadcast(channel, event);
    },
  )
  .subscribe();

console.log(`Realtime server running on ws://localhost:${PORT}`);
