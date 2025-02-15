'use client';
import DatasetForm from "@/components/dataForm";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
function Home() {
  return <DatasetForm />
}

export default withAccessControl(Home, ['organization_admin', 'contributor']);
