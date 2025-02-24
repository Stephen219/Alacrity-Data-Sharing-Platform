'use client' 
;
import  DatasetsPage  from "@/components/all_datasets/all_datasets";
import { withAccessControl } from "@/components/auth_guard/AccessControl";


function DisplayAllDatasets() {
  
  return (
    <div>
      <DatasetsPage />
    </div>
  );
}

export default withAccessControl(DisplayAllDatasets, ['organization_admin', 'researcher', 'contributor']);
  