"use client";

import DatasetDetailPage from "@/components/chat/issue";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation";

function Home() {
  const { id } = useParams();
  return <DatasetDetailPage params={{ dataset_id: id as string }} />;
}

export default withAccessControl(Home, ['organization_admin', 'researcher', 'contributor']);
