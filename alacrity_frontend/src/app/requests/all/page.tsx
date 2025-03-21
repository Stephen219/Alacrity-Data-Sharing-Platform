"use client";
import AllRequests from "@/components/requests/all";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function Home() {
  return <AllRequests />
}

export default withAccessControl(Home, ['organization_admin', 'contributor']);