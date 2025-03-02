'use client'

import DescriptionPage from "@/components/all_datasets/description";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function Home() {
  return <DescriptionPage />
}

export default withAccessControl(Home, ['organization_admin', 'contributor', 'researcher']);