import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export type AuthTokenPayload = {
  userId: number;
  role: Role;
};

export const signAccessToken = (payload: AuthTokenPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.jwtSecret, {
    ...options
  });
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
};
