"use client";
import ApproveRequest from "@/components/requests/card";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation";

function Home() {
  const { id } = useParams(); 

  return <ApproveRequest requestId={id} />; 
}

export default withAccessControl(Home, ['organization_admin', 'contributor']);
