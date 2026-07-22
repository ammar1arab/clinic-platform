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