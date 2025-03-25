"use client";

import type React from "react";
import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/config";
import PendingSubmissionsTable from "@/components/tables/PendingSubmissionsTable";


interface PendingSubmission {
  id: number;
  title: string;
  description: string;
  researcher_email: string;
  submitted_at: string;
  status: string;
}

const PendingSubmissions: React.FC = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
 

  const getPendingSubmissions = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/research/submissions/pending/`);
      if (!response.ok) throw new Error("Failed to fetch pending submissions");
      const result: PendingSubmission[] = await response.json();
      setPendingSubmissions(result);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
    }
  };


  useEffect(() => {
    getPendingSubmissions();
  }, []);




  return (
<div>

    {/* Pending Research Submissions table component */}
    <PendingSubmissionsTable
  submissions={pendingSubmissions}       // Pass all submissions
  enablePagination={true}                  // Enable pagination
  pageSize={8}                             // Display 5 items per page
  enableVerticalScroll={true}
  verticalScrollHeight="800px"             // Increase the scrollable area height
  showSortDropdown={true}                  // Allow user to toggle sort order
  showSearchBar={true}                     // Enable a search bar for filtering
/>
   
</div>

  );
};






export default PendingSubmissions;