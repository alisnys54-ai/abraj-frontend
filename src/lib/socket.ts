'use client';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

let socket: Socket | null = null;

/** Derives the WebSocket origin. Prefers NEXT_PUBLIC_WS_URL; otherwise falls
 * back to the API URL's origin (stripping the /api/v1 path); only uses
 * localhost as a last resort in local dev. */
function resolveWsUrl(): string | null {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Deployed with no explicit config — don't hammer localhost from prod.
    return null;
  }
  return 'http://localhost:3000';
}

/** Connects once per session to the backend's authenticated notifications
 * gateway. Best-effort only — if this never connects, GET /notifications
 * polling still covers everything. Never throws; any failure is swallowed so
 * it can't break app rendering. */
export function getNotificationsSocket(): Socket | null {
  try {
    if (typeof window === 'undefined') return null;
    const token = tokenStore.getAccess();
    if (!token) return null;
    if (socket?.connected) return socket;

    const wsUrl = resolveWsUrl();
    if (!wsUrl) return null;

    socket = io(`${wsUrl}/ws/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    // Swallow connection errors so they never surface as uncaught exceptions.
    socket.on('connect_error', () => { /* best-effort, ignore */ });
    return socket;
  } catch {
    return null;
  }
}

export function disconnectNotificationsSocket() {
  try {
    socket?.disconnect();
  } catch {
    /* ignore */
  }
  socket = null;
}
