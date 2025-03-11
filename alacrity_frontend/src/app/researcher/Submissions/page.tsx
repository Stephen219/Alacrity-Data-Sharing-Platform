"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import SubmissionButtons from "@/components/SubmissionsButtons";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `http://127.0.0.1:8000/research/submissions/?sort=${sortOrder}`
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

  const handleSoftDelete = async (id: number) => {
    const confirmDelete = window.confirm("Move this submission to Recently Deleted?");
    if (!confirmDelete) return;

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const handleTogglePrivacy = async (id: number, currentStatus: boolean) => {
    const confirmToggle = window.confirm(
      `Are you sure you want to make this submission ${currentStatus ? "public" : "private"}?`
    );
    if (!confirmToggle) return;
  
    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/toggle-privacy/${id}/`,
        {
          method: "PATCH",
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle privacy.");
      }
  
      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.id === id ? { ...submission, is_private: !currentStatus } : submission
        )
      );
    } catch (error) {
      console.error("Error toggling privacy:", error);
    }
  };
  

  return (
    <Published
      header="My Research"
      submissions={submissions}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => {
        const submission = submissions.find((s) => s.id === id);

        return (
          <div className="flex gap-2">
            <SubmissionButtons
              onDelete={() => handleSoftDelete(id)}
              onSecondaryAction={() => handleRead(id)}
              secondaryActionLabel="Read"
            />

            {/* Separate Privacy Toggle Button */}
            <button
              onClick={() => handleTogglePrivacy(id, submission?.is_private ?? false)}
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-700"
            >
              {submission?.is_private ? "Make Public" : "Make Private"}
            </button>
          </div>
        );
      }}
    />
  );
};

export default AnalysisList;
