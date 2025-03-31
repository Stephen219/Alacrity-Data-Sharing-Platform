"use client";

import ChatPage from "@/components/chat/chattinguser";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function ChattingUser() {
  const { id } = useParams(); // `id` comes from the dynamic route `[id]`
  const router = useRouter();

  // Debug logging
  console.log("Loading ChattingUser for conversation_id:", id);

  // Validate `id` and redirect if invalid
  useEffect(() => {
    if (!id || id === "undefined") {
      console.error("Invalid or missing conversation ID:", id);
      router.push("/chat/users/chats"); // Redirect to chat list if ID is invalid
    }
  }, [id, router]);

  // If id is invalid, return null or a loading state to prevent rendering ChatPage
  if (!id || id === "undefined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">Invalid conversation ID. Redirecting...</p>
      </div>
    );
  }

  // Pass `id` as `params.id` to match ChatPage's expected props
  return <ChatPage params={{ id: id as string }} />;
}

export default withAccessControl(ChattingUser, [
  "organization_admin",
  "researcher",
  "contributor",
]);