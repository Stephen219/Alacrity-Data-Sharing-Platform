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

const RecentlyDeleted = () => {
    const [deletedSubmissions, setDeletedSubmissions] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchDeletedSubmissions = async () => {
        try {
          const response = await fetchWithAuth("http://127.0.0.1:8000/research/submissions/recently-deleted/");
          if (!response.ok) throw new Error("Failed to fetch deleted submissions.");
          const data = await response.json();
          setDeletedSubmissions(Array.isArray(data) ? data : []);
        } catch (err) {
          setError((err as Error).message);
        }
        setLoading(false);
      };
      fetchDeletedSubmissions();
    }, []);
  
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
  
    const handlePermanentDelete = async (id: number) => {
      const confirmDelete = window.confirm("Are you sure you want to permanently delete this submission?");
      if (!confirmDelete) return;
      
      try {
        const response = await fetchWithAuth(`http://127.0.0.1:8000/research/submissions/permanent-delete/${id}/`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to permanently delete submission.");
        setDeletedSubmissions((prev) => prev.filter((submission) => submission.id !== id));
      } catch (error) {
        console.error("Error permanently deleting submission:", error);
      }
    };
  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
  
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Recently Deleted</h2>
        {deletedSubmissions.length === 0 ? (
          <p>No deleted submissions found.</p>
        ) : (
          <ul className="space-y-4">
            {deletedSubmissions.map((submission) => (
              <li key={submission.id} className="p-4 border rounded shadow">
                <h3 className="text-lg font-semibold">{submission.title}</h3>
                <button onClick={() => handleRestore(submission.id)} className="bg-green-500 text-white px-4 py-2 mt-2 rounded hover:bg-green-600">Restore</button>
                <button onClick={() => handlePermanentDelete(submission.id)} className="bg-red-500 text-white px-4 py-2 mt-2 ml-2 rounded hover:bg-red-600">Permanently Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };
  
  export default RecentlyDeleted;
