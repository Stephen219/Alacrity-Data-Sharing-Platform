"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await fetchWithAuth("http://127.0.0.1:8000/research/drafts/");
        if (!response.ok) throw new Error("Failed to fetch drafts.");
        const data = await response.json();
        setDrafts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };
    fetchDrafts();
  }, []);

  const handleSoftDeleteDraft = async (id: number) => {
    const confirmDelete = window.confirm("Move this draft to Recently Deleted?");
    if (!confirmDelete) return;
  
    try {
      const response = await fetchWithAuth(`http://127.0.0.1:8000/research/drafts/delete/${id}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }, //keep
      });
  
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to soft delete draft.");
        } else {
          throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
        }
      }
  
      const data = await response.json();
      console.log("Soft delete response:", data);
  
      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
    }  catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error soft deleting draft:", error.message);
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
    
  };


  const handleEdit = (draft: Analysis) => {
    setEditingDraft({ ...draft });
  };

  const handleSave = async (publish = false) => {
    if (!editingDraft) return;
  
    try {
      const response = await fetchWithAuth(
        `http://127.0.0.1:8000/research/submissions/edit/${editingDraft.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" }, //keep this or error 
          body: JSON.stringify({
            ...editingDraft,
            status: publish ? "published" : "draft",
          }),
        }
      );
  
      const data = await response.json();
      if (response.ok) {
        setDrafts((prev) =>
          prev.map((d) => (d.id === editingDraft.id ? { ...d, status: data.status } : d))
        );
        setEditingDraft(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Failed to save draft.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Your Drafts</h2>

      {editingDraft ? (
        <div className="p-4 border rounded shadow">
          <input
            type="text"
            value={editingDraft.title}
            onChange={(e) => setEditingDraft({ ...editingDraft, title: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />
          <textarea
            value={editingDraft.description}
            onChange={(e) => setEditingDraft({ ...editingDraft, description: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />
          <textarea
            value={editingDraft.raw_results}
            onChange={(e) => setEditingDraft({ ...editingDraft, raw_results: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />
          <textarea
            value={editingDraft.summary}
            onChange={(e) => setEditingDraft({ ...editingDraft, summary: e.target.value })}
            className="w-full p-2 border rounded mt-2"
          />

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleSave(false)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Publish
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {drafts.map((draft) => (
            <li key={draft.id} className="p-4 border rounded shadow">
              <h3 className="text-lg font-semibold">{draft.title}</h3>
              <button onClick={() => handleEdit(draft)} className="bg-gray-500 text-white px-4 py-2 mt-2 rounded hover:bg-gray-600">
                Edit
              </button>
              <button
                onClick={() => handleSoftDeleteDraft(draft.id)}
                className="bg-red-500 text-white px-4 py-2 mt-2 ml-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DraftList;
