import { io, Socket } from "socket.io-client";

type ServerToClientEvents = {
  task_assigned: (data: any) => void;
  notification: (data: any) => void;
};

type ClientToServerEvents = {};

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const socket: Socket<
  ServerToClientEvents,
  ClientToServerEvents
> = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

export const connectSocket = (token: string) => {
  if (!token) return;

  if (socket.connected) return;

  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

if (typeof window !== "undefined") {
  (window as any).socket = socket;
}

socket.on("connect", () => {
  console.log("SOCKET_CONNECTED", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("SOCKET_DISCONNECTED", reason);
});

socket.on("connect_error", (err) => {
  console.error("SOCKET_ERROR", err.message);
});

socket.on("task_assigned", (data) => {
  console.log("TASK_ASSIGNED", data);
});

socket.on("notification", (data) => {
  console.log("NOTIFICATION", data);
});