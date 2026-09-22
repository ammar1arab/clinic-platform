import { io, Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.NEXT_PUBLIC_API_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocketAfterPaint(socket = getSocket()): () => void {
  if (socket.connected) return () => {};

  let cancelled = false;
  let inner = 0;
  const outer = window.requestAnimationFrame(() => {
    inner = window.requestAnimationFrame(() => {
      if (!cancelled && !socket.connected) socket.connect();
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(outer);
    if (inner) window.cancelAnimationFrame(inner);
  };
}
