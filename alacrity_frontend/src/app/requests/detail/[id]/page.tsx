"use client";

import DatasetDetailPage from "@/components/all_datasets/dataset_detail";
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { useParams } from "next/navigation"; // Use useParams to get the ID from URL

function Home() {
    const { id } = useParams(); // since the folder is [id], you get 'id'
    return <DatasetDetailPage params={{ dataset_id: id }} />; 
}

export default withAccessControl(Home, [ 'researcher']);
