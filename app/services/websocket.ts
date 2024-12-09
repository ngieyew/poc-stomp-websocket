import { Client } from "@stomp/stompjs";

class WebSocketService {
  private client: Client;
  private static instance: WebSocketService;

  private constructor() {
    this.client = new Client({
      brokerURL: `ws://${"localhost:3000"}/stomp`,
      connectHeaders: {
        login: "user",
        passcode: "password",
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log("STOMP Connected:", frame);
    };

    this.client.onStompError = (frame) => {
      console.error("STOMP Error:", frame.headers["message"]);
    };

    this.client.onWebSocketError = (event) => {
      console.error("WebSocket Error:", event);
    };

    this.client.onDisconnect = () => {
      console.log("STOMP Disconnected");
    };
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    console.log("Connecting to WebSocket", this.client);
    if (!this.client.connected) {
      this.client.activate();
    }
  }

  disconnect() {
    if (this.client.connected) {
      this.client.deactivate();
    }
  }

  subscribe(destination: string, callback: (message: unknown) => void) {
    if (!this.client.connected) {
      throw new Error("STOMP client is not connected");
    }
    return this.client.subscribe(destination, (message) => {
      callback(JSON.parse(message.body));
    });
  }

  send(destination: string, body: unknown) {
    if (!this.client.connected) {
      throw new Error("STOMP client is not connected");
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  isConnected(): boolean {
    return this.client.connected;
  }
}

export const websocketService = WebSocketService.getInstance();
