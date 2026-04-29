import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

type SocketUser = {
  id: number;
  role: Role;
};

export const socketAuthMiddleware = (socket: Socket, next: any) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;

    socket.data.user = decoded;

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
};