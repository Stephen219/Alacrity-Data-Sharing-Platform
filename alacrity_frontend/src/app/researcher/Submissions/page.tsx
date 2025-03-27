/* eslint-disable */

"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import SubmissionButtons from "@/components/SubmissionsButtons";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

interface Analysis {
  id: number;
  title: string;
  summary: string;
  status?: string;
  is_private: boolean;
}

const AnalysisList: React.FC = () => {
  const [submissions, setSubmissions] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [publicSubmissions, setPublicSubmissions] = useState<Analysis[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `${BACKEND_URL}/research/submissions/?sort=${sortOrder}`
        );
        if (!response.ok) throw new Error("Failed to fetch submissions.");
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchSubmissions();
  }, [sortOrder]);


  const fetchPublicSubmissions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/research/submissions/view/");
      if (!response.ok) throw new Error("Failed to fetch public submissions.");
  
      const data = await response.json();
      const allSubmissions = [
        ...(Array.isArray(data.recent_submissions) ? data.recent_submissions : []),
        ...(Array.isArray(data.popular_submissions) ? data.popular_submissions : []),
      ];
  
      // Remove duplicates based on id
      const uniqueSubmissions = Array.from(new Map(allSubmissions.map((item) => [item.id, item])).values());
      setPublicSubmissions(uniqueSubmissions);
    } catch (error) {
      console.error("Error fetching public submissions:", error);
    }
  };
  


  const handleSoftDelete = async (id: number) => {

    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/delete/${id}/`,
        { method: "DELETE" }
      );

      const data = await response.json();
      console.log("Soft delete response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to soft delete submission.");
      }

      setSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    } catch (error) {
      console.error("Error soft deleting submission:", error);
    }
  };

  const router = useRouter();

  const handleRead = (id: number) => {
    router.push(`/researcher/Submissions/view/${id}`);
  };

  const handleTogglePrivacy = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/toggle-privacy/${id}/`,
        { method: "PATCH" }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle privacy.");
      }
  
      // Instantly update submission in profile (My Submissions)
      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.id === id ? { ...submission, is_private: data.is_private } : submission
        )
      );
  
      // "All Submissions" reflects change
      if (data.is_private) {
        // If private, remove from public submissions
        setPublicSubmissions((prev) => prev.filter((submission) => submission.id !== id));
      } else {
        // If it's now public, refetch public submissions
        fetchPublicSubmissions();
      }
  
      console.log(`Privacy toggled for ${id}: Now ${data.is_private ? "Private" : "Public"}`);
    } catch (error) {
      console.error("Error toggling privacy:", error);
    }
  };
  
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  

  return (
    <Published
      header="My Research"
      submissions={submissions}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => {
        const submission = submissions.find((s) => s.id === id);

        return (
          <div className="flex flex-col items-center gap-3">
            
            <SubmissionButtons
  onDelete={() => handleSoftDelete(id)}
  onSecondaryAction={() => handleRead(id)}
  secondaryActionLabel="Read"
  showToggle={true}
  isPrivate={submission?.is_private ?? false}
  onToggle={() => handleTogglePrivacy(id, submission?.is_private ?? false)}
/>


          </div>
        );
      }}
    />
  );
};

export default AnalysisList;
