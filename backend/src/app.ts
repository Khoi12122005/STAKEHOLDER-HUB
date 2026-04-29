import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { aiRoutes } from "./modules/ai/ai.routes";
import { auditRoutes } from "./modules/audit/audit.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { exportRoutes } from "./modules/export/export.routes";
import { meetingRoutes } from "./modules/meetings/meeting.routes";
import { minuteRoutes } from "./modules/minutes/minute.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { taskRoutes } from "./modules/tasks/task.routes";
import { sendResponse } from "./utils/response";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  sendResponse(res, 200, true, "API is healthy", { service: "SCMH API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/minutes", minuteRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;