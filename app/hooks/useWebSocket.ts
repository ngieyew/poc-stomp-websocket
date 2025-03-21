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
      websocketService.setToken("eyJraWQiOiI4OTI4ZDUyOS05MjA3LTQ3Y2EtOTVjMy04MTllYTQwNzUzYzciLCJhbGciOiJSUzI1NiJ9.eyJtZXJDb2RlIjoidHNtIiwic3ViIjoia2N0ZXN0IiwicGx5SWQiOjIsInJvbGVzIjpbXSwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo2MDg1L2F1dGgiLCJhdXRob3JpdGllcyI6W10sImF1ZCI6Ind0bGItcHJ0bC1hcHAiLCJuYmYiOjE3MzM3MjM1NDAsInVzck5tIjoia2N0ZXN0IiwiY3VyQ29kZSI6Ik1ZUiIsImV4cCI6MTczMzc1MzU0MCwiaWF0IjoxNzMzNzIzNTQwLCJqdGkiOiJmOGU5NzZkOS04MjliLTRlZDQtODNiZS1hOWQwMmU2MDZjOGQifQ.wP7qiVcS1Gbs3d-AZUwoEwWWe22lACZovipdLLScg8P6cc30A63fx3e7wq_N4QVn9h_9yytHqq-YgwzoIHsKh78EqPZmPkRgdGhnNyT1TVztbk_R-Y6vZQmXLleiKfA59XD0BMUWgXG6fPjlauoC_f91-JF2BaTvA-HrElX7Zbwj70Ly1KKt5uHQCY0PBwojak7tRvu1gkT7zhYR1fg3aH-37DEkXnd_EmKMHAZyeSKbtqwI1h1yE7Em8ig7SWB76lacTs9ywy46vjm7WyldYDrc5sr3ezm-5ge50lSakdf_zfblHDM8rIHnm1I5DX1KwsX6ITN66GZIyYjYpTekbA");
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
        websocketService.send(topic, "PING");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [topic]
  );

  return { sendMessage, isConnected, error };
};
