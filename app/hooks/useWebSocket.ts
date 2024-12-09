"use client";

import { useEffect, useCallback, useState } from "react";
import { websocketService } from "../services/websocket";

export const useWebSocket = (
  topic: string,
  callback: (data: any) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    try {
      console.log("Attempting connection...");
      if (!websocketService.isConnected()) {
        websocketService.connect();
      }

      // Wait for connection before subscribing
      setTimeout(() => {
        try {
          const subscription = websocketService.subscribe(topic, callback);
          setIsConnected(true);
          setError(null);
          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.error("Subscription error:", err);
          setError(err instanceof Error ? err.message : "Failed to subscribe");
          setIsConnected(false);
        }
      }, 1000);

      return () => {};
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
      return () => {};
    }
  }, [topic, callback]);

  useEffect(() => {
    const unsubscribe = connect();
    return () => {
      unsubscribe();
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message: { content: string }) => {
      try {
        websocketService.send(topic, message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [topic]
  );

  return { sendMessage, isConnected, error };
};
