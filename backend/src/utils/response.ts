import { Response } from "express";

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data ?? null
  });
};
