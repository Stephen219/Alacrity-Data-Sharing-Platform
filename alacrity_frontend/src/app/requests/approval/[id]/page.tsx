"use client";
import ApproveRequest from "@/components/requests/card";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation"; // Use useParams to get the ID from URL

function Home() {
  const { id } = useParams(); // Get the id from the URL

  return <ApproveRequest requestId={id} />; // Pass id as requestId prop
}

export default withAccessControl(Home, ['organization_admin', 'contributor']);
