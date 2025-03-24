"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Send, ArrowLeft, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "admin";
  content: string;
  timestamp: Date;
}

interface Dataset {
  dataset_id: string;
  title: string;
  organization: string;
}

export default function ChatPage({ params }: { params: { dataset_id: string } }) {
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<string>("Connecting...");
  const [isTyping, setIsTyping] = useState(false); // New: Typing indicator

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchDatasetAndMessages = async () => {
      try {
        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`);
        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset details");
        const datasetData = await datasetResponse.json();
        setDataset(datasetData);

        const messagesResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/chats/${params.dataset_id}/messages/`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchDatasetAndMessages();

    const connectWebSocket = () => {
      if (socketRef.current) socketRef.current.close();

      let retryCount = 0;
      const maxRetries = 5;
      let retryTimeout;

      const token = localStorage.getItem("access_token");
      const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
      const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");
      const wsUrl = `${wsScheme}://${wsHost}/ws/datasets/chats/${params.dataset_id}/messages/?token=${token}`;
      console.log("Attempting to connect to WebSocket at:", wsUrl);

      const attemptConnection = () => {
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("WebSocket connection established");
          setSocketStatus("Connected");
          retryCount = 0;
          if (retryTimeout) clearTimeout(retryTimeout);
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.message) {
              setMessages((prev) => [...prev, data.message]);
            } else if (data.error) {
              console.error("WebSocket error:", data.error);
            } else if (data.type === "connection_established") {
              console.log("Connection confirmation:", data.message);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        socketRef.current.onerror = () => {
          console.error("WebSocket error occurred");
          setSocketStatus("Error");
        };

        socketRef.current.onclose = (event) => {
          console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
          setSocketStatus("Disconnected");
          if (retryCount < maxRetries) {
            retryCount++;
            const delayMs = 3000;
            setSocketStatus(`Reconnecting... (${retryCount}/${maxRetries})`);
            retryTimeout = setTimeout(attemptConnection, delayMs);
          } else {
            setSocketStatus("Failed to connect");
          }
        };
      };

      attemptConnection();

      return socketRef.current;
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [params.dataset_id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !dataset || !socketRef.current) return;

    if (socketRef.current.readyState === WebSocket.OPEN) {
      const timestamp = new Date();
      const messageData = {
        content: newMessage,
        sender: "user",
        timestamp: timestamp.toISOString(),
      };

      socketRef.current.send(JSON.stringify(messageData));
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), ...messageData, timestamp },
      ]);
      setNewMessage("");
    } else {
      alert("Connection lost. Please wait while we reconnect...");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1 ml-3">
          <h1 className="text-xl font-bold text-gray-800">{dataset?.title}</h1>
          <p className="text-sm text-gray-600">
            Support for {dataset?.organization}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${
            socketStatus === "Connected"
              ? "bg-green-100 text-green-800"
              : socketStatus.includes("Reconnecting")
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {socketStatus}
        </span>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200">
              <p className="text-gray-600">
                Start a conversation with the dataset administrators. Ask questions or report issues.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-end space-x-2 max-w-[70%] ${
                    message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      message.sender === "user" ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    {message.sender === "user" ? "U" : "A"}
                  </div>
                  <div
                    className={`p-3 rounded-lg shadow-sm ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                    }`}
                  >
                    <p>{message.content}</p>
                    <span
                      className={`text-xs mt-1 block ${
                        message.sender === "user" ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 shadow-inner">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800 placeholder-gray-400"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || socketRef.current?.readyState !== WebSocket.OPEN}
            className={`p-3 rounded-md flex items-center justify-center transition-colors ${
              !newMessage.trim() || socketRef.current?.readyState !== WebSocket.OPEN
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}