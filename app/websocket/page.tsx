"use client";

import { useState, useCallback } from "react";
import { useWebSocket } from "@/app/hooks/useWebSocket";

export default function Chat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const handleMessage = useCallback((message: any) => {
    setMessages((prev) => [...prev, message.content]);
  }, []);

  const { sendMessage, isConnected, error } = useWebSocket(
    "/topic/chat",
    handleMessage
  );

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      sendMessage({ content: `${username}: ${inputMessage}` });
      setInputMessage("");
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username.trim() !== "") {
      setIsAuthenticated(true);
    }
  };

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <div className="mb-2 flex justify-between">
        <div>
          <span>Status:</span>
          {isConnected ? (
            <span className="text-green-600">Connected</span>
          ) : (
            <span className="text-red-600">Disconnected</span>
          )}
        </div>
        <div>
          <span>Username:</span>
          {isAuthenticated && username ? (
            <span>{username}</span>
          ) : (
            <span className="text-red-600">Not Logged In</span>
          )}
        </div>
      </div>

      <div className="h-80 overflow-y-auto border rounded p-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-100 rounded text-black">
            {msg}
          </div>
        ))}
      </div>

      {!isAuthenticated && (
        <form className="flex gap-2" onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 p-2 border rounded text-black"
            placeholder="Enter your username..."
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded ${
              isConnected
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isConnected}
          >
            Login
          </button>
        </form>
      )}

      {isAuthenticated && (
        <form className="flex gap-2" onSubmit={handleSend}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 p-2 border rounded text-black"
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded ${
              isConnected
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isConnected}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
