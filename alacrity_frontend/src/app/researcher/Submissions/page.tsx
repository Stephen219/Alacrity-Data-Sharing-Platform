"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import SubmissionButtons from "@/components/SubmissionsButtons";

interface Analysis {
  id: number;
  title: string;
  summary: string;
  status?: string;
}

const AnalysisList = () => {
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

  const handleRead = (id: number) => {
    console.log("Reading submission:", id);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Published
      header = "My research"
      submissions={submissions}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => (
        <SubmissionButtons
          onDelete={() => handleSoftDelete(id)}
          onSecondaryAction={() => handleRead(id)}
          secondaryActionLabel="Read"
        />
      )}
    />
  );
};

export default AnalysisList;
