// app/chats/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Loader2 } from "lucide-react";

interface ChatSummary {
  dataset_id: string;
  title: string;
  organization: string;
  last_message?: string;
  last_timestamp?: string;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/chats/`);
        console.log("Fetch chats response status:", response.status);
        if (response.ok) {
          const chatData = await response.json();
          console.log("Fetched chat data:", chatData);
          setChats(Array.isArray(chatData) ? chatData : []);
        } else {
          console.warn("Failed to fetch chats:", response.status, await response.text());
          setChats([]);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found in localStorage");
        return;
      }
      const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
      const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");
      const wsUrl = `${wsScheme}://${wsHost}/ws/user/?token=${token}`;
      console.log("Connecting to user WebSocket:", wsUrl);
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log("User WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("User WebSocket message:", data);
        if (data.message) {
          setChats((prev) => {
            const existingChat = prev.find((chat) => chat.dataset_id === data.message.dataset_id);
            if (existingChat) {
              return prev.map((chat) =>
                chat.dataset_id === data.message.dataset_id
                  ? {
                      ...chat,
                      last_message: data.message.last_message || data.message.content,
                      last_timestamp: data.message.last_timestamp || data.message.timestamp,
                    }
                  : chat
              );
            } else {
              return [
                ...prev,
                {
                  dataset_id: data.message.dataset_id,
                  title: data.message.title || "New Chat",
                  organization: data.message.organization || "Unknown",
                  last_message: data.message.last_message || data.message.content,
                  last_timestamp: data.message.last_timestamp || data.message.timestamp,
                },
              ];
            }
          });
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("User WebSocket error:", error);  // Improved logging
      };

      socketRef.current.onclose = (event) => {
        console.log("User WebSocket closed. Code:", event.code, "Reason:", event.reason);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md p-4 flex items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Chats</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {chats.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200">
              <p className="text-gray-600">No chats available. Start a new conversation!</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.dataset_id}
                onClick={() => router.push(`/chat/${chat.dataset_id}`)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-gray-800">{chat.title}</h2>
                <p className="text-sm text-gray-600">{chat.organization}</p>
                {chat.last_message && (
                  <p className="text-sm text-gray-500 truncate">{chat.last_message}</p>
                )}
                {chat.last_timestamp && (
                  <p className="text-xs text-gray-400">
                    {new Date(chat.last_timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}