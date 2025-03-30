"use client";

import DatasetDetailPage from "@/components/chat/chattinguser";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation";

function chattinguser(){
    const { id } = useParams();
    return <DatasetDetailPage params={{ conversation_id: id as string }} />;
}

export default withAccessControl(chattinguser, ['organization_admin', 'researcher', 'contributor']);