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

const RecentlyDeleted = () => {
  const [deletedSubmissions, setDeletedSubmissions] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const fetchDeletedSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `http://127.0.0.1:8000/research/submissions/recently-deleted/?sort=${sortOrder}` 
        );
        if (!response.ok) throw new Error("Failed to fetch deleted submissions.");
        const data = await response.json();
        setDeletedSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };
  
    fetchDeletedSubmissions();
  }, [sortOrder]); 
  

  const handleRestore = async (id: number) => {
    try {
      const response = await fetchWithAuth(`http://127.0.0.1:8000/research/submissions/restore/${id}/`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to restore submission.");
      setDeletedSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    } catch (error) {
      console.error("Error restoring submission:", error);
    }
  };

  const handleHardDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this submission?");
    if (!confirmDelete) return;

    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/permanent-delete/${id}/`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to permanently delete submission.");

      setDeletedSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    } catch (error) {
      console.error("Error permanently deleting submission:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Published
    header = "Recently Deleted"
      submissions={deletedSubmissions}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => (
        <SubmissionButtons
          onDelete={() => handleHardDelete(id)}
          onSecondaryAction={() => handleRestore(id)}
          secondaryActionLabel="Restore"
        />
      )}
    />
  );
};

export default RecentlyDeleted;
