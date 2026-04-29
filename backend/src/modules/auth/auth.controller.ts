import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/response";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    sendResponse(res, 201, true, "Registered successfully", result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    sendResponse(res, 200, true, "Logged in successfully", result);
  },

  async me(req: Request, res: Response) {
    const profile = await authService.getProfile(req.user!.id);
    sendResponse(res, 200, true, "Profile fetched successfully", profile);
  }
};
