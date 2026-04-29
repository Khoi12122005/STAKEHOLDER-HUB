import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { sendResponse } from "../utils/response";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      sendResponse(res, 409, false, "Duplicate resource", error.meta);
      return;
    }

    if (error.code === "P2025") {
      sendResponse(res, 404, false, "Resource not found", error.meta);
      return;
    }
  }

  if (error instanceof AppError) {
    sendResponse(res, error.statusCode, false, error.message, error.details);
    return;
  }

  console.error(error);
  sendResponse(res, 500, false, "Internal server error");
};
