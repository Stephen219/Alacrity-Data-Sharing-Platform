"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Message {
  message_id: string;
  sender_id: number;
  content: string;
  timestamp: Date;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_profile_picture?: string | null;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
}

interface DecodedToken {
  user_id: number;
}

interface ChatPageProps {
  params: { id: string };
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<string>("Connecting...");
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (socketRef.current) socketRef.current.close();

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found");
      setSocketStatus("Authentication failed");
      router.push("/login");
      return;
    }

    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");
    const wsUrl = `${wsScheme}://${wsHost}/ws/chat/${params.id}/?token=${token}`;
    console.log("Connecting to WebSocket at:", wsUrl);

    let retryCount = 0;
    const maxRetries = 5;

    const attemptConnection = () => {
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established for conversation:", params.id);
        setSocketStatus("Connected");
        retryCount = 0;
        socketRef.current?.send(JSON.stringify({ mark_read: true }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          if (data.error) {
            console.error("WebSocket error:", data.error);
            return;
          }
          if (data.message) {
            const newMessage = {
              message_id: data.message.message_id || `fallback-${Date.now()}-${Math.random()}`,
              sender_id: data.message.sender_id,
              content: data.message.content || data.message.message,
              timestamp: new Date(data.message.timestamp),
              sender_first_name: data.message.sender_first_name,
              sender_last_name: data.message.sender_last_name,
              sender_profile_picture: data.message.sender_profile_picture,
            };
            setMessages((prev) => {
              const optimisticIndex = prev.findIndex(
                (m) => typeof m.message_id === "string" && m.message_id.startsWith("temp-") && m.content === newMessage.content
              );
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = newMessage;
                console.log("Replaced optimistic message with server response:", newMessage);
                return updated;
              }
              if (!prev.some((m) => m.message_id === newMessage.message_id)) {
                console.log("Adding new message to state:", newMessage);
                return [...prev, newMessage];
              }
              console.log("Message already exists, skipping:", newMessage);
              return prev;
            });
          } else if (data.is_typing !== undefined) {
            setIsTyping(data.is_typing);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socketRef.current.onerror = (event) => {
        console.error("WebSocket error occurred:", event);
        setSocketStatus("Error");
      };

      socketRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setSocketStatus("Disconnected");
        if (retryCount < maxRetries && event.code !== 1000) {
          retryCount++;
          const delayMs = Math.min(3000 * 2 ** retryCount, 30000); // Exponential backoff, max 30s
          setSocketStatus(`Reconnecting... (${retryCount}/${maxRetries})`);
          setTimeout(attemptConnection, delayMs);
        } else {
          setSocketStatus("Failed to connect");
        }
      };
    };

    attemptConnection();
  };

  useEffect(() => {
    if (!params.id || params.id === "undefined") {
      console.error("Invalid conversation ID:", params.id);
      router.push("/chat/users/chats");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found");
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setCurrentUserId(decoded.user_id);
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/login");
      return;
    }

    const fetchConversationData = async () => {
      try {
        const conversationResponse = await fetchWithAuth(
          `${BACKEND_URL}/users/api/conversations/${params.id}/`
        );
        if (!conversationResponse.ok) throw new Error(`Conversation fetch failed: ${conversationResponse.status}`);
        const conversationData = await conversationResponse.json();
        const recipientUser =
          conversationData.participant1.id === currentUserId
            ? conversationData.participant2
            : conversationData.participant1;
        setRecipient({
          id: recipientUser.id,
          first_name: recipientUser.first_name,
          last_name: recipientUser.last_name,
          profile_picture: recipientUser.profile_picture,
        });

        const messagesResponse = await fetchWithAuth(
          `${BACKEND_URL}/users/api/conversations/${params.id}/messages/`
        );
        if (!messagesResponse.ok) throw new Error(`Messages fetch failed: ${messagesResponse.status}`);
        const messagesData = await messagesResponse.json();
        const initialMessages = Array.isArray(messagesData)
          ? messagesData.map((msg) => ({
              message_id: msg.message_id || `fallback-${Date.now()}-${Math.random()}`,
              sender_id: msg.sender_id,
              content: msg.message || msg.content,
              timestamp: new Date(msg.timestamp || msg.created_at),
              sender_first_name: msg.sender_first_name,
              sender_last_name: msg.sender_last_name,
              sender_profile_picture: msg.sender_profile_picture,
            }))
          : [];
        setMessages(initialMessages);
        console.log("Initial messages fetched:", initialMessages);
      } catch (error) {
        console.error("Fetch error:", error);
        router.push("/chat/users/chats");
      } finally {
        setLoading(false);
      }
    };

    fetchConversationData();

    const connectWebSocket = () => {
      if (socketRef.current) socketRef.current.close();

      let retryCount = 0;
      const maxRetries = 5;
      let retryTimeout: NodeJS.Timeout;

      const attemptConnection = () => {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        // const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");

        // you kow why   the backend on prod has a /api/ at the end of the url
        // so we need to remove it from the url before we connect to the websocket
        const wsHost = BACKEND_URL.replace(/^https?:\/\//, "").replace(/\/api\/?$/, "");
        const wsUrl = `${wsScheme}://${wsHost}/ws/chat/${params.id}/?token=${token}`;
        console.log("Connecting to WebSocket at:", wsUrl);
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("WebSocket connection established for conversation:", params.id);
          setSocketStatus("Connected");
          retryCount = 0;
          if (retryTimeout) clearTimeout(retryTimeout);
          // Mark conversation as read on connect
          socketRef.current?.send(JSON.stringify({ mark_read: true }));
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            if (data.error) {
              console.error("WebSocket error:", data.error);
              return;
            }
            if (data.message) {
              const newMessage = {
                message_id: data.message.message_id || `fallback-${Date.now()}-${Math.random()}`,
                sender_id: data.message.sender_id,
                content: data.message.content || data.message.message,
                timestamp: new Date(data.message.timestamp),
                sender_first_name: data.message.sender_first_name,
                sender_last_name: data.message.sender_last_name,
                sender_profile_picture: data.message.sender_profile_picture,
              };
              setMessages((prev) => {
                const optimisticIndex = prev.findIndex(
                  (m) => typeof m.message_id === "string" && m.message_id.startsWith("temp-") && m.content === newMessage.content
                );
                if (optimisticIndex !== -1) {
                  const updated = [...prev];
                  updated[optimisticIndex] = newMessage;
                  console.log("Replaced optimistic message with server response:", newMessage);
                  return updated;
                }
                if (!prev.some((m) => m.message_id === newMessage.message_id)) {
                  console.log("Adding new message to state:", newMessage);
                  return [...prev, newMessage];
                }
                console.log("Message already exists, skipping:", newMessage);
                return prev;
              });
            } else if (data.is_typing !== undefined) {
              setIsTyping(data.is_typing);
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
          console.log("WebSocket closed:", event.code, event.reason);
          setSocketStatus("Disconnected");
          if (retryCount < maxRetries && event.code !== 1000) {
            retryCount++;
            const delayMs = 3000 * retryCount;
            setSocketStatus(`Reconnecting... (${retryCount}/${maxRetries})`);
            retryTimeout = setTimeout(attemptConnection, delayMs);
          } else {
            setSocketStatus("Failed to connect");
          }
        };
      };

      attemptConnection();
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close(1000, "Component unmounting");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [params.id, router, currentUserId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message. WebSocket state:", socketRef.current?.readyState);
      alert("Connection not ready. Please wait...");
      return;
    }

    const messageData = { message: newMessage };
    console.log("Sending message:", messageData);
    socketRef.current.send(JSON.stringify(messageData));
    const optimisticMessage: Message = {
      message_id: `temp-${Date.now()}`,
      sender_id: currentUserId!,
      content: newMessage,
      timestamp: new Date(),
      sender_first_name: "You",
      sender_last_name: "",
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ typing: true }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ typing: false }));
        }
      }, 2000);
    } else {
      console.log("Typing event skipped: WebSocket not open");
    }
  };

  useEffect(() => {
    const textarea = document.querySelector("textarea");
    textarea?.addEventListener("input", handleTyping);

    return () => {
      textarea?.removeEventListener("input", handleTyping);
    };
  }, []);

  const isCurrentUserMessage = (message: Message) => {
    return currentUserId === message.sender_id;
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
          onClick={() => router.push("/chat/users/chats")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center ml-3">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            {recipient?.profile_picture ? (
              <img
                src={recipient.profile_picture}
                alt={`${recipient.first_name} ${recipient.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                {recipient?.first_name?.[0] || "U"}
                {recipient?.last_name?.[0] || ""}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">
              {recipient ? `${recipient.first_name} ${recipient.last_name}` : "Chat"}
            </h1>
          </div>
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
              Start a conversation with {recipient?.first_name || "this user"}.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.message_id || `message-${index}`}
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
                          alt={`${message.sender_first_name} ${message.sender_last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-white font-semibold ${
                            isCurrentUserMessage(message) ? "bg-blue-500" : "bg-gray-500"
                          }`}
                        >
                          {message.sender_first_name?.[0] || "U"}
                          {message.sender_last_name?.[0] || ""}
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
                <div key="typing-indicator" className="flex justify-start px-6 py-2">
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