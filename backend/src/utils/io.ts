import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "@/middlewares/socket-auth.middleware";
import { Role } from "@prisma/client";

type SocketUser = {
  id: number;
  role: Role;
};

type ServerToClientEvents = {
  task_assigned: (data: any) => void;
  notification: (data: any) => void;
};

type ClientToServerEvents = {
  ping: () => void;
};

type InterServerEvents = {};

type SocketData = {
  user?: SocketUser;
};

let io: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const initSocket = (server: HttpServer) => {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: "*"
    }
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const room = `user-${user.id}`;
    socket.join(room);

    console.log(`🔥 SOCKET CONNECTED: ${socket.id} | user-${user.id}`);

    socket.on("ping", () => {
      console.log(`📡 Ping from user-${user.id}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ SOCKET DISCONNECTED: user-${user.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};