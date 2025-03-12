"use client";
import DatasetAccessed from "@/components/all_datasets/withAccess";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
function DatasetWithAccess() {return (<div><DatasetAccessed /></div> );}export default withAccessControl(DatasetWithAccess, ['organization_admin', 'researcher', 'contributor']);