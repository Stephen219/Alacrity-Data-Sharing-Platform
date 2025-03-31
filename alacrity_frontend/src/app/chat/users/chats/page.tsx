"use client";

import UserChatListPage from "@/components/chat/chats-user";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function UserChatList() {
  return (
    <div>
      <UserChatListPage />
    </div>
  );
}

export default withAccessControl(UserChatList, ['organization_admin', 'researcher', 'contributor']);