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
  participant: {
    first_name: string;
    sur_name: string;
    profile_picture?: string | null;
  };
  last_message?: string;
  last_timestamp?: string;
  unread_count: number;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingStatus, setTypingStatus] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);

  const fetchChats = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/chats/`, { cache: "no-store" });
      console.log("Fetch chats response status:", response.status);
      if (response.ok) {
        const chatData = await response.json();
        console.log("Fetched chat data:", chatData);
        const fetchedChats = Array.isArray(chatData) ? chatData : [];
        setChats(fetchedChats);
        setFilteredChats(fetchedChats);
      } else {
        console.warn("Failed to fetch chats, status:", response.status);
        setChats([]);
        setFilteredChats([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      setChats([]);
      setFilteredChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found in localStorage");
        return;
      }

      // Delay WebSocket connection by 1 second to ensure token availability
      setTimeout(() => {
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
                        last_message: data.message.last_message,
                        last_timestamp: data.message.last_timestamp,
                        unread_count: data.message.unread_count,
                      }
                    : chat
                );
              } else {
                const newChat = {
                  dataset_id: data.message.dataset_id,
                  title: data.message.title || "New Chat",
                  organization: data.message.organization || "Unknown",
                  participant: {
                    first_name: data.message.participant_first_name || "Unknown",
                    sur_name: data.message.participant_sur_name || "",
                    profile_picture: data.message.participant_profile_picture || null,
                  },
                  last_message: data.message.last_message,
                  last_timestamp: data.message.last_timestamp,
                  unread_count: data.message.unread_count || 1,
                };
                const updatedChats = [...prev, newChat];
                setFilteredChats(updatedChats); // Update filtered chats as well
                return updatedChats;
              }
            });
          } else if (data.typing !== undefined) {
            setTypingStatus((prev) => ({
              ...prev,
              [data.dataset_id]: data.is_typing,
            }));
          }
        };

        socketRef.current.onerror = (error) => {
          console.error("User WebSocket error:", error);
          if (error instanceof Event) {
            console.error("Error event details:", error);
          }
        };

        socketRef.current.onclose = (event) => {
          console.log("User WebSocket closed. Code:", event.code, "Reason:", event.reason);
        };
      }, 1000); // Delay WebSocket connection by 1 second
    };

    connectWebSocket();

    const handleFocus = () => {
      console.log("Window regained focus, refetching chats...");
      fetchChats();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      if (socketRef.current) socketRef.current.close();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Filter chats based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chats.filter((chat) => {
        const fullName = `${chat.participant.first_name} ${chat.participant.sur_name}`.toLowerCase();
        return fullName.includes(query);
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-1">
        <div className="max-w-5xl mx-auto bg-white rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h1 className="text-2xl font-bold">Chats</h1>
            <input
              type="text"
              placeholder="Search by Participant Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full md:w-64"
            />
          </div>
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No chats available. Start a new conversation!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => (
                <div
                  key={chat.dataset_id}
                  className="hover:bg-gray-100 cursor-pointer transition px-6 py-4 flex items-center space-x-4"
                  onClick={() => router.push(`/chat/${chat.dataset_id}`)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {chat.participant.profile_picture ? (
                      <img
                        src={chat.participant.profile_picture}
                        alt={`${chat.participant.first_name} ${chat.participant.sur_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                        {chat.participant.first_name[0]}
                        {chat.participant.sur_name[0] || ""}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-black">
                      {chat.participant.first_name} {chat.participant.sur_name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {typingStatus[chat.dataset_id] ? (
                        <p className="text-sm text-gray-500 flex items-center">
                          <span className="animate-pulse">...</span> Typing
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {chat.last_message || "No messages yet"}
                        </p>
                      )}
                      {chat.unread_count > 0 && !typingStatus[chat.dataset_id] && (
                        <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}