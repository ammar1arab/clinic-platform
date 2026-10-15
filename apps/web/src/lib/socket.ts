import { io, type Socket } from "socket.io-client";
import { env } from "./env";
import { getToken } from "./auth-token";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket"],
      autoConnect: false,
      auth: (callback) => callback({ token: getToken() }),
    });
  }
  return socket;
}
