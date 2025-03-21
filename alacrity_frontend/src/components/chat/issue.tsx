"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

  useEffect(() => {
    const fetchDatasetAndMessages = async () => {
      try {
        // Fetch dataset info
        const datasetResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/`)
        if (!datasetResponse.ok) throw new Error("Failed to fetch dataset details")
        const datasetData = await datasetResponse.json()
        setDataset(datasetData)

        // Fetch existing messages if any
        // This endpoint would need to be implemented in your backend
        const messagesResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/messages/`)
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
  }, [params.dataset_id])

  const sendMessage = async () => {
    if (!newMessage.trim() || !dataset) return
    
    // Create a temporary ID and timestamp for immediate UI update
    const tempId = Date.now().toString()
    const timestamp = new Date()
    
    // Optimistically add message to UI
    const userMessage: Message = {
      id: tempId,
      sender: 'user',
      content: newMessage,
      timestamp
    }
    
    setMessages(prev => [...prev, userMessage])
    setNewMessage("")
    
    try {
      // Send to backend
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${params.dataset_id}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage
        }),
      })
      
      if (!response.ok) throw new Error("Failed to send message")
      
      // Optionally update with the real message ID from the server
      const savedMessage = await response.json()
      
      // If it's the first message, add a welcome message from admin
      if (messages.length === 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'welcome',
            sender: 'admin',
            content: `Thank you for reaching out about "${dataset.title}". How can we help you today?`,
            timestamp: new Date()
          }])
        }, 1000)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove the message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      alert("Failed to send message. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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
        <div>
          <h1 className="font-semibold text-xl">
            {dataset?.title}
          </h1>
          <p className="text-sm text-gray-500">
            Issue support for {dataset?.organization}
          </p>
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
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
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
            disabled={!newMessage.trim()}
            className={`bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-md h-full flex items-center justify-center ${
              !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}