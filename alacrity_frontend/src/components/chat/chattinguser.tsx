"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { fetchWithAuth } from "@/libs/auth";
import { BACKEND_URL } from "@/config";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";


interface Message {
    user_id: string;
    sender_email: string;
    message: string;
    content: string;
    timestamp: Date;
    sender_first_name?: string;
    sender_sur_name?: string;
    sender_profile_picture?: string | null;
}

interface ChattingUserProps {
    conversationId: number;
    token: string;
    recipientEmail: string;
    first_name: string;
    sur_name: string;
    profile_picture: string | null;
}

export default function ChattingUser({{ params }: { params: { converstionId: string } }}) {
const router = useRouter();
const {conversationId } = params;
const [messages, setMessages] = useState<Message[]>([]);
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(true);
const [recipientEmail, setRecipientEmail] = useState("");

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
    // Decode the JWT to get the current user's email
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setCurrentUserEmail(decoded.email);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    } else {
      console.error("No access token found in localStorage");
      router.push("/login");
    }

}