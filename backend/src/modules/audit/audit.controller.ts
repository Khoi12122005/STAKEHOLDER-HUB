import { Request, Response } from "express";
import { auditService } from "./audit.service";
import { sendResponse } from "../../utils/response";

export const auditController = {
  async listLogs(_req: Request, res: Response) {
    const logs = await auditService.listLogs();
    sendResponse(res, 200, true, "Audit logs fetched successfully", logs);
  }
};
