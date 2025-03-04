"use client";
import PendingRequest from "@/components/requests/pending";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function Home() {
  return <PendingRequest />
}

export default withAccessControl(Home, ['organization_admin', 'contributor']);