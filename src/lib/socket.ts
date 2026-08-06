'use client';
import { io, type Socket } from 'socket.io-client';
import { tokenStore } from './token-store';

let socket: Socket | null = null;

/** Connects once per session to the backend's authenticated notifications gateway. Best-effort only — if this never connects, GET /notifications polling still covers everything. */
export function getNotificationsSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = tokenStore.getAccess();
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'}/ws/notifications`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });
  return socket;
}

export function disconnectNotificationsSocket() {
  socket?.disconnect();
  socket = null;
}
