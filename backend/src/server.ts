import http from "http";
import app from "./app";
import { initSocket } from "@/utils/io";
import { env } from "./config/env";

const server = http.createServer(app);

initSocket(server);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});