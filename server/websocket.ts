import { Server } from "http";
import { StompServer } from "./stomp-server";

export function initWebSocketServer(server: Server) {
  return new StompServer(server);
}