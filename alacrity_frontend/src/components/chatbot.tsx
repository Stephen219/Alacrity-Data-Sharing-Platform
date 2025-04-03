"use client";
import React, { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { BACKEND_URL } from "@/config";

interface Message {
  text: string;
  isUser: boolean;
  actions?: { label: string; href: string }[];
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchBotResponse = async (userInput: string = "") => {
    setIsLoading(true);
    try {
      console.log("Fetching with input:", userInput);
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to get bot response: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      setMessages((prev) => [
        ...prev,
        { text: data.text, isUser: false, actions: data.actions || [] },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Oops, something went wrong. Try again!", isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessages([]); // Clear previous messages
      fetchBotResponse(""); // Fetch initial message
    }
  }, [isOpen]);

  const handleSend = (inputValue: string = input) => {
    if (!inputValue.trim()) return;

    console.log("Sending input:", inputValue);
    setMessages((prev) => [...prev, { text: inputValue, isUser: true }]);
    setInput("");
    fetchBotResponse(inputValue);
  };

  const handleActionClick = (href: string) => {
    console.log("Button clicked, href:", href);
    if (href.startsWith("/")) {
      // Navigation link, let Link handle it
      return;
    }
    // Treat as input to continue conversation
    handleSend(href);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border border-gray-200">
          <div className="flex justify-between items-center p-3 bg-orange-600 text-white rounded-t-lg">
            <span className="font-semibold">AlacrityBot</span>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 ${msg.isUser ? "text-right" : "text-left"}`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.isUser
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {msg.actions.map((action, idx) => (
                        <Link
                          key={idx}
                          href={action.href}
                          onClick={(e) => {
                            if (!action.href.startsWith("/")) {
                              e.preventDefault(); // Prevent navigation
                              handleActionClick(action.href);
                            }
                          }}
                          className={buttonVariants({
                            size: "sm",
                            className: "bg-orange-600 text-white hover:bg-orange-700",
                          })}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="text-center text-gray-500 text-sm">Typing...</div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;