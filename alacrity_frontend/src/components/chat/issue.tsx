"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import { Send, ArrowLeft } from "lucide-react"

interface Message {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: Date;
}

interface Dataset {
  dataset_id: string;
  title: string;
  organization: string;
}

export default function ChatPage({ params }: { params: { dataset_id: string } }) {
  const router = useRouter()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [socketStatus, setSocketStatus] = useState<string>("Connecting...")
  
  // Create a ref to hold the WebSocket connection
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchDatasetAndMessages = async () => {
      try {
        // Fetch dataset info
        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`)
        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset details")
        const datasetData = await datasetResponse.json()
        setDataset(datasetData)

        // Fetch existing messages if any
        const messagesResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/chats/${params.dataset_id}/messages/`) 
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchDatasetAndMessages()

    // Create WebSocket connection
    const connectWebSocket = () => {
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Track retry attempts
      let retryCount = 0;
      const maxRetries = 5;
      let retryTimeout;
      
      // Use the full path with 'ws/' prefix as suggested
      
      const token = localStorage.getItem('access_token'); // Adjust based on your auth storage
      const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsHost = BACKEND_URL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsScheme}://${wsHost}/ws/datasets/chats/${params.dataset_id}/messages/?token=${token}`;
      console.log("Attempting to connect to WebSocket at:", wsUrl);
      socketRef.current = new WebSocket(wsUrl);
      
      const attemptConnection = () => {
        // Create new connection
        socketRef.current = new WebSocket(wsUrl);
        
        socketRef.current.onopen = () => {
          console.log('WebSocket connection established');
          setSocketStatus("Connected");
          // Reset retry count on successful connection
          retryCount = 0;
          // Clear any pending retry timeouts
          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }
        };
        
        socketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            // Update your chat UI with the new message
            if (data.message) {
              setMessages(prev => [...prev, data.message]);
            } else if (data.error) {
              console.error("WebSocket error message:", data.error);
            } else if (data.type === 'connection_established') {
              console.log("Connection confirmation:", data.message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        socketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setSocketStatus("Error");
        };
        
        socketRef.current.onclose = (event) => {
          console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
          setSocketStatus("Disconnected");
          
          // Check if we should retry
          if (retryCount < maxRetries) {
            retryCount++;
            const delayMs = 3000; // 3 seconds between retries
            
            console.log(`Attempt ${retryCount} of ${maxRetries}. Reconnecting in ${delayMs/1000} seconds...`);
            setSocketStatus(`Reconnecting... (Attempt ${retryCount}/${maxRetries})`);
            
            // Attempt to reconnect with delay
            retryTimeout = setTimeout(() => {
              attemptConnection();
            }, delayMs);
          } else {
            console.log("Maximum retry attempts reached. Giving up.");
            setSocketStatus("Failed to connect after 5 attempts");
          }
        };
      };
      
      // Start the first connection attempt
      attemptConnection();
      
      // Return the socketRef for external reference if needed
      return socketRef.current;
    };
    
    connectWebSocket();
    
    // Cleanup function
    return () => {
      console.log("Cleaning up WebSocket connection");
      if (socketRef.current) {
        // Use a normal close code (1000)
        socketRef.current.close(1000, "Component unmounting");
      }
    };
  }, [params.dataset_id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !dataset) return;
    
    // Add validation to check if socket exists
    if (!socketRef.current) {
      console.error("WebSocket is not initialized.");
      setSocketStatus("Not connected");
      return;
    }
    
    // Check if WebSocket is open before sending the message
    if (socketRef.current.readyState === WebSocket.OPEN) {
      const timestamp = new Date();
      const messageData = {
        content: newMessage,
        sender: 'user',
        timestamp: timestamp.toISOString(),
      };
      
      console.log("Sending message:", messageData);
      socketRef.current.send(JSON.stringify(messageData));
      
      // Optimistically add message to UI
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        content: newMessage,
        timestamp,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage("");
    } else {
      console.error("WebSocket is not open. Current state:", socketRef.current.readyState);
      setSocketStatus(`Not connected (State: ${socketRef.current.readyState})`);
      alert("Connection lost. Please wait while we reconnect...");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading chat...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center">
        <button 
          onClick={() => router.back()} 
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-xl">
            {dataset?.title}
          </h1>
          <p className="text-sm text-gray-500">
            Issue support for {dataset?.organization}
          </p>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          socketStatus === "Connected" 
            ? "bg-green-100 text-green-700" 
            : socketStatus === "Reconnecting..." 
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
        }`}>
          {socketStatus}
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome message if no messages yet */}
          {messages.length === 0 && (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-gray-700">
                Start a conversation with the dataset administrators. Describe any issues, ask questions, or request assistance.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 rounded-bl-none'
                }`}
              >
                <p>{message.content}</p>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Anchor for auto-scrolling */}
        </div>
      </div>

      {/* Message input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 border border-gray-300 rounded-l-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || socketRef.current?.readyState !== WebSocket.OPEN}
            className={`bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-md h-full flex items-center justify-center ${
              !newMessage.trim() || socketRef.current?.readyState !== WebSocket.OPEN ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}