import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

export interface StompFrame {
  command: string;
  headers: { [key: string]: string };
  body?: string;
}

export interface StompSubscription {
  id: string;
  destination: string;
  callback: (message: StompFrame) => void;
}

export interface StompSession {
  ws: WebSocket;
  subscriptions: Map<string, StompSubscription>;
}

export class StompServer {
  private sessions: Map<WebSocket, StompSession> = new Map();
  private subscriptions: Map<string, Set<StompSubscription>> = new Map();

  constructor(server: Server) {
    const wss = new WebSocketServer({
      server,
      path: "/stomp", // Change from "/ws" to "/stomp"
    });

    wss.on("connection", (ws: WebSocket) => {
      console.log("Client connected");
      this.handleConnection(ws);
    });

    // Simulate server-to-client message
    // setInterval(() => {
    //   this.broadcastServerMessage();
    // }, 5000);
  }

  private broadcastServerMessage(): void {
    const frame: StompFrame = {
      command: "SEND",
      headers: {
        destination: "/topic/chat",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        content: `Server Message at ${new Date().toLocaleTimeString()}`,
      }),
    };

    // Use handleSend to broadcast to all subscribers
    this.handleSend(frame);
  }

  private handleConnection(ws: WebSocket): void {
    const session: StompSession = {
      ws,
      subscriptions: new Map(),
    };

    this.sessions.set(ws, session);

    ws.on("message", (data: Buffer) => {
      try {
        const frame = this.parseFrame(data.toString());
        this.handleFrame(frame, session);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      this.handleDisconnection(session);
    });
  }

  private parseFrame(data: string): StompFrame {
    const [command, ...lines] = data.split("\n");
    const headers: { [key: string]: string } = {};
    let body: string | undefined;

    let i = 0;
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") break;
      const [key, value] = line.split(":");
      headers[key] = value;
    }

    if (i < lines.length - 1) {
      body = lines.slice(i + 1).join("\n");
    }

    return { command, headers, body };
  }

  private handleFrame(frame: StompFrame, session: StompSession): void {
    switch (frame.command) {
      case "CONNECT":
        this.handleConnect(frame, session);
        break;
      case "SUBSCRIBE":
        this.handleSubscribe(frame, session);
        break;
      case "UNSUBSCRIBE":
        this.handleUnsubscribe(frame, session);
        break;
      case "SEND":
        this.handleSend(frame);
        break;
      case "DISCONNECT":
        this.handleDisconnect(session);
        break;
    }
  }

  private handleConnect(frame: StompFrame, session: StompSession): void {
    const response: StompFrame = {
      command: "CONNECTED",
      headers: {
        version: "1.2",
        "heart-beat": "0,0",
      },
    };
    session.ws.send(this.serializeFrame(response));
  }

  private handleSubscribe(frame: StompFrame, session: StompSession): void {
    const { id, destination } = frame.headers;
    if (!id || !destination) return;

    const subscription: StompSubscription = {
      id,
      destination,
      callback: (message: StompFrame) => {
        session.ws.send(
          this.serializeFrame({
            command: "MESSAGE",
            headers: {
              subscription: id,
              destination: destination,
              "content-type": "application/json",
            },
            body: message.body,
          })
        );
      },
    };

    session.subscriptions.set(id, subscription);

    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, new Set());
    }
    this.subscriptions.get(destination)?.add(subscription);
  }

  private handleUnsubscribe(frame: StompFrame, session: StompSession): void {
    const { id } = frame.headers;
    if (!id) return;

    const subscription = session.subscriptions.get(id);
    if (subscription) {
      const subs = this.subscriptions.get(subscription.destination);
      subs?.delete(subscription);
      session.subscriptions.delete(id);
    }
  }

  private handleSend(frame: StompFrame): void {
    const { destination } = frame.headers;
    if (!destination || !frame.body) return;

    const subs = this.subscriptions.get(destination);
    if (subs) {
      subs.forEach((sub) => sub.callback(frame));
    }
  }

  private handleDisconnect(session: StompSession): void {
    session.subscriptions.forEach((sub) => {
      const subs = this.subscriptions.get(sub.destination);
      subs?.delete(sub);
    });
    this.sessions.delete(session.ws);
  }

  private handleDisconnection(session: StompSession): void {
    this.handleDisconnect(session);
  }

  private serializeFrame(frame: StompFrame): string {
    let result = frame.command + "\n";

    Object.entries(frame.headers).forEach(([key, value]) => {
      result += `${key}:${value}\n`;
    });

    result += "\n";
    if (frame.body) {
      result += frame.body;
    }
    result += "\0";

    return result;
  }
}
