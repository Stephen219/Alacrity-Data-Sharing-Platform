"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Loader2, Plus } from "lucide-react";

interface ChatSummary {
  conversation_id: string;
  participant: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string | null;
  };
  last_message?: string;
  last_timestamp?: string;
  unread_count: number;
}

interface SearchUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

export default function UserChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingStatus, setTypingStatus] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [socketStatus, setSocketStatus] = useState<string>("Connecting...");
  const socketRef = useRef<WebSocket | null>(null);

  const fetchChats = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/users/api/conversations/`, { cache: "no-store" });
      if (response.ok) {
        const chatData = await response.json();
        setChats(chatData);
        setFilteredChats(chatData);
      } else {
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

  const searchResearchers = async (query: string) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/users/api/search-users/?q=${query}`);
      if (response.ok) {
        setSearchResults(await response.json());
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching researchers:", error);
      setSearchResults([]);
    }
  };

  const startChat = async (recipientId: number) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/users/api/start-chat/${recipientId}/`);
      if (response.ok) {
        const { conversation_id } = await response.json();
        router.push(`/chat/users/message/${conversation_id}`);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  useEffect(() => {
    fetchChats();

    const connectWebSocket = () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No access token found, skipping WebSocket connection");
        setSocketStatus("Authentication failed");
        router.push("/login");
        return;
      }

      const wsScheme = BACKEND_URL.startsWith("https") ? "wss" : "ws";
      // const wsHost = BACKEND_URL.replace(/^https?:\/\//, "");
      
      const wsHost = BACKEND_URL.replace(/^https?:\/\//, "").replace(/\/api$/, "");
      const wsUrl = `${wsScheme}://${wsHost}/ws/users/chats/?token=${token}`;
      console.log("Connecting to User Chat List WebSocket at:", wsUrl);

      let retryCount = 0;
      const maxRetries = 5;
      let retryTimeout: NodeJS.Timeout;

      const attemptConnection = () => {
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => {
          console.log("User Chat List WebSocket connected");
          setSocketStatus("Connected");
          retryCount = 0;
          if (retryTimeout) clearTimeout(retryTimeout);
        };

        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            if (data.error) {
              console.error("WebSocket error from server:", data.error);
              return;
            }
            if (data.message) {
              setChats((prev) => {
                const updated = prev.map((chat) =>
                  chat.conversation_id === data.message.conversation_id
                    ? {
                        ...chat,
                        last_message: data.message.message,
                        last_timestamp: data.message.timestamp,
                        unread_count: chat.unread_count + 1,
                      }
                    : chat
                );
                setFilteredChats(updated);
                return updated;
              });
            } else if (data.is_typing !== undefined) {
              setTypingStatus((prev) => ({ ...prev, [data.conversation_id]: data.is_typing }));
            } else if (data.read_conversation) {
              setChats((prev) => {
                const updated = prev.map((chat) =>
                  chat.conversation_id === data.read_conversation
                    ? { ...chat, unread_count: 0 }
                    : chat
                );
                setFilteredChats(updated);
                return updated;
              });
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
          console.log("WebSocket closed with code:", event.code, "reason:", event.reason);
          setSocketStatus("Disconnected");
          if (retryCount < maxRetries && event.code !== 1000) {
            retryCount++;
            const delayMs = 3000 * retryCount;
            setSocketStatus(`Reconnecting... (${retryCount}/${maxRetries})`);
            retryTimeout = setTimeout(attemptConnection, delayMs);
          } else {
            setSocketStatus("Failed to connect after retries");
          }
        };
      };

      attemptConnection();
    };

    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredChats(
        chats.filter((chat) =>
          `${chat.participant.first_name} ${chat.participant.last_name}`.toLowerCase().includes(query)
        )
      );
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
        <div className="max-w-5xl mx-auto bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">User Chats</h1>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded p-2 w-64"
              />
              <button
                onClick={() => setShowSearchModal(true)}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                <Plus className="w-5 h-5" />
              </button>
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
            </div>
          </div>
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No chats yet. Start a new one!</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => (
                <div
                  key={chat.conversation_id}
                  className="hover:bg-gray-100 cursor-pointer transition px-6 py-4 flex items-center space-x-4"
                  onClick={() => router.push(`/chat/users/message/${chat.conversation_id}`)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {chat.participant.profile_picture ? (
                      <img
                        src={chat.participant.profile_picture}
                        alt={`${chat.participant.first_name} ${chat.participant.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                        {chat.participant.first_name[0]}
                        {chat.participant.last_name[0] || ""}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-black">
                      {chat.participant.first_name} {chat.participant.last_name}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {typingStatus[chat.conversation_id] ? (
                        <p className="text-sm text-gray-500 flex items-center">
                          <span className="animate-pulse">...</span> Typing
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">{chat.last_message || "No messages yet"}</p>
                      )}
                      {chat.unread_count > 0 && !typingStatus[chat.conversation_id] && (
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

      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Start a New Chat</h2>
            <input
              type="text"
              placeholder="Search researchers..."
              onChange={(e) => searchResearchers(e.target.value)}
              className="border border-gray-300 rounded p-2 w-full mb-4"
            />
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => startChat(user.id)}
                >
                  {user.first_name} {user.last_name} ({user.username})
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSearchModal(false)}
              className="mt-4 bg-gray-300 text-black p-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}