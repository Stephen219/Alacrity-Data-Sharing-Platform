"use client"; 

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import SubmissionButtons from "@/components/SubmissionsButtons";
import { useRouter } from "next/navigation"; 

interface Analysis {
  id: number;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  status: string;
  deleted_at?: string;
}

const DraftList = () => {
  const [drafts, setDrafts] = useState<Analysis[]>([]);
  const [editingDraft, setEditingDraft] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const router = useRouter();

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `http://127.0.0.1:8000/research/drafts/?sort=${sortOrder}`
        );
        if (!response.ok) throw new Error("Failed to fetch drafts.");
        const data = await response.json();
        setDrafts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchDrafts();
  }, [sortOrder]);

  const handleSoftDeleteDraft = async (id: number) => {
    const confirmDelete = window.confirm("Move this draft to Recently Deleted?");
    if (!confirmDelete) return;

    try {
      const response = await fetchWithAuth(`http://127.0.0.1:8000/research/drafts/delete/${id}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to soft delete draft.");
      }

      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
      console.log("Draft moved to Recently Deleted:", await response.json());
    } catch (error) {
      console.error("Error soft deleting draft:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  const handleEdit = (draft: Analysis) => {
    router.push(`/researcher/drafts/edit/${draft.id}`);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <Published
      header="My Drafts"
      submissions={drafts}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => {
        const draft = drafts.find((d) => d.id === id);
        if (!draft) return null;

        return (
          <SubmissionButtons
            onDelete={() => handleSoftDeleteDraft(id)}
            onSecondaryAction={() => handleEdit(draft)}
            secondaryActionLabel="Edit"
          />
        );
      }}
    />
  );
};

export default DraftList;
