import { Client } from "@stomp/stompjs";

class WebSocketService {
  private client: Client;
  private static instance: WebSocketService;
  private token: string | null = null;

  private constructor() {
    this.client = new Client({
      // brokerURL: `ws://${"localhost:3000"}/ws`,
      // connectHeaders: {
      //   login: "user",
      //   passcode: "password",
      // },
      brokerURL: `wss://idev-portal.bulianx.local/gtw/ply/prtl/ws`,
      beforeConnect: () => {
        if (!this.token) {
          throw new Error("Bearer token not set");
        }
        this.client.connectHeaders = {
          authorization: `Bearer ${this.token}`,
        };
      },
      debug: (str) => {
        if (str.includes("heart")) {
          console.log("%c[Heartbeat]", "color: purple", str);
        } else {
          console.log("%c[STOMP Debug]", "color: blue", str);
        }
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

    // this.client.subscribe
  }

  setToken(token: string) {
    this.token = token;
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
    console.log("Sending message to", destination, body);
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
