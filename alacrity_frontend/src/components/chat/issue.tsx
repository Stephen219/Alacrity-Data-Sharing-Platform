"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Message {
  message_id: string;
  sender: "user" | "admin";
  content: string;
  timestamp: Date;
  sender_first_name?: string;
  sender_surname?: string;
  sender_profile_picture?: string | null;
  sender_email?: string;
}

interface Dataset {
  dataset_id: string;
  title: string;
  organization: string;
}

interface DecodedToken {
  email: string;
  user_id: number;
}

interface UserProfile {
  role: string; // e.g., "researcher", "admin", etc.
}

export default function DatasetChatPage({ params }: { params: { dataset_id: string } }) {
  const router = useRouter();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<string>("Connecting...");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // New state for role

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found in localStorage");
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setCurrentUserEmail(decoded.email);
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/login");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/`);
        if (!response.ok) throw new Error("Failed to fetch user profile");
        const profileData: UserProfile = await response.json();
        setUserRole(profileData.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null); // Fallback to null if fetch fails
      }
    };

    const fetchDatasetAndMessages = async () => {
      try {
        console.log("Fetching for dataset_id:", params.dataset_id);
        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`);
        if (!datasetResponse.ok) {
          throw new Error(`Dataset fetch failed: ${datasetResponse.status}`);
        }
        const datasetData = await datasetResponse.json();
        console.log("Dataset data:", datasetData);
        setDataset(datasetData);

        const messagesResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/messages/${params.dataset_id}/`);
        if (!messagesResponse.ok) {
          throw new Error(`Messages fetch failed: ${messagesResponse.status}`);
        }
        const messagesData = await messagesResponse.json();
        console.log("Messages data:", messagesData);
        setMessages(
          Array.isArray(messagesData)
            ? messagesData.map((msg) => ({
                message_id: msg.message_id,
                sender: msg.sender,
                content: msg.content,
                timestamp: new Date(msg.timestamp || msg.created_at),
                sender_first_name: msg.sender_first_name,
                sender_surname: msg.sender_surname,
                sender_profile_picture: msg.sender_profile_picture,
                sender_email: msg.sender_email || `${msg.sender_first_name}.${msg.sender_surname}@example.com`,
              }))
            : []
        );
      } catch (error) {
        console.error("Fetch error:", error);
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole(); // Fetch role first
    fetchDatasetAndMessages();

    const connectWebSocket = () => {
      if (socketRef.current) socketRef.current.close();

      let retryCount = 0;
      const maxRetries = 5;
      let retryTimeout: NodeJS.Timeout;

      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No token for WebSocket");
        setSocketStatus("Authentication failed");
        router.push("/login");
        return;
      }

      const attemptConnection = () => {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");
        const wsUrl = `${wsScheme}://${wsHost}/ws/datasets/chats/${params.dataset_id}/messages/?token=${token}`;
        console.log("Connecting to Dataset WebSocket at:", wsUrl);
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("WebSocket connection established for dataset:", params.dataset_id);
          setSocketStatus("Connected");
          retryCount = 0;
          if (retryTimeout) clearTimeout(retryTimeout);
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.error) {
              console.error("WebSocket error:", data.error);
              return;
            }
            if (data.message) {
              setMessages((prev) => {
                const newMessage = {
                  message_id: data.message.message_id,
                  sender: data.message.sender,
                  content: data.message.content,
                  timestamp: new Date(data.message.timestamp),
                  sender_first_name: data.message.sender_first_name,
                  sender_surname: data.message.sender_surname,
                  sender_profile_picture: data.message.sender_profile_picture,
                  sender_email: `${data.message.sender_first_name}.${data.message.sender_surname}@example.com`,
                };
                if (prev.some((m) => m.message_id === newMessage.message_id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            } else if (data.typing !== undefined) {
              setIsTyping(data.typing);
            } else if (data.type === "connection_established") {
              console.log("Connection confirmation:", data.message);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        socketRef.current.onerror = (error) => {
          console.error("WebSocket error occurred:", error);
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

      setTimeout(() => attemptConnection(), 1000);
    };

    connectWebSocket();

    const handleTyping = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ typing: true }));
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current?.send(JSON.stringify({ typing: false }));
        }, 2000);
      }
    };

    const textarea = document.querySelector("textarea");
    textarea?.addEventListener("input", handleTyping);

    return () => {
      if (socketRef.current) socketRef.current.close(1000, "Component unmounting");
      textarea?.removeEventListener("input", handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [params.dataset_id, router]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    if (socketRef.current.readyState === WebSocket.OPEN) {
      const messageData = { content: newMessage };
      socketRef.current.send(JSON.stringify(messageData));
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

  const isCurrentUserMessage = (message: Message) => {
    return currentUserEmail === message.sender_email;
  };

  const handleBackClick = () => {
    if (userRole === "researcher") {
      router.push(`/requests/detail/${params.dataset_id}`);
    } else {
      router.push("/chat");
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
      <header className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={handleBackClick} // Updated to use handleBackClick
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1 ml-3">
          <h1 className="text-xl font-bold text-gray-800">{dataset?.title || "Chat"}</h1>
          <p className="text-sm text-gray-600">
            Support for {dataset?.organization || "Unknown Organization"}
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

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Start a conversation with the dataset administrators. Ask questions or report issues.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.message_id}
                  className={`flex ${
                    isCurrentUserMessage(message) ? "justify-end" : "justify-start"
                  } px-6 py-2`}
                >
                  <div
                    className={`flex items-end space-x-2 max-w-[70%] ${
                      isCurrentUserMessage(message) ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {message.sender_profile_picture ? (
                        <img
                          src={message.sender_profile_picture}
                          alt={`${message.sender_first_name} ${message.sender_surname}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-white font-semibold ${
                            isCurrentUserMessage(message) ? "bg-blue-500" : "bg-gray-500"
                          }`}
                        >
                          {message.sender_first_name?.[0] || "U"}
                          {message.sender_surname?.[0] || ""}
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        isCurrentUserMessage(message)
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      <p>{message.content}</p>
                      <span
                        className={`text-xs mt-1 block ${
                          isCurrentUserMessage(message) ? "text-blue-100" : "text-gray-500"
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
              ))}
              {isTyping && (
                <div className="flex justify-start px-6 py-2">
                  <div className="flex items-end space-x-2 max-w-[70%]">
                    <div className="w-8 h-8 rounded-full bg-gray-500" />
                    <div className="p-3 rounded-lg bg-white text-gray-800 rounded-bl-none border border-gray-200">
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center gap-3 p-4">
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