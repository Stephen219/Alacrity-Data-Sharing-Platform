'use client' ;
import  ChatsPage  from "@/components/chat/chats";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
function DisplayChats() {
  
  return (
    <div>
      <ChatsPage />
    </div>
  );
}

export default withAccessControl(DisplayChats, ['organization_admin', 'researcher', 'contributor']);
  