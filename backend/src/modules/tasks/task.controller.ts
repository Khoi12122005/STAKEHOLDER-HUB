import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { taskService } from "./task.service";

export const taskController = {
  async listTasks(req: Request, res: Response) {
    const tasks = await taskService.listTasks(req.user!, req.query as never);
    sendResponse(res, 200, true, "Tasks fetched successfully", tasks);
  },

  async getTask(req: Request, res: Response) {
    const task = await taskService.getTaskById(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Task fetched successfully", task);
  },

  async createTask(req: Request, res: Response) {
    const task = await taskService.createTask(req.body, req.user!);
    sendResponse(res, 201, true, "Task created successfully", task);
  },

  async updateTask(req: Request, res: Response) {
    const task = await taskService.updateTask(Number(req.params.id), req.body, req.user!);
    sendResponse(res, 200, true, "Task updated successfully", task);
  },

  async deleteTask(req: Request, res: Response) {
    await taskService.deleteTask(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Task deleted successfully");
  },

  async sendReminder(req: Request, res: Response) {
    await taskService.sendReminder(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Task reminder sent successfully");
  }
};
