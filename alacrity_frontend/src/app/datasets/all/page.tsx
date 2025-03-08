/**
 * @fileoverview This file renders the page for displaying all datasets.
 * It includes access control to ensure only authorized users can view the page.
 * 
 * @package @alacrity/frontend
 * 
 * @component
 * @example
 * // This example shows how to use the DisplayAllDatasets component.
 * import DisplayAllDatasets from 'path/to/this/file';
 * 
 * function App() {
 *   return (
 *     <DisplayAllDatasets />
 *   );
 * }
 * 
 * @returns {JSX.Element} The rendered component for displaying all datasets.
 * 
 * @accessControl
 * This component is wrapped with access control to restrict access to users with the following roles:
 * - organization_admin
 * - researcher
 * - contributor
 */
'use client' ;
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
  