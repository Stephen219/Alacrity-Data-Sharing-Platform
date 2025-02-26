"use client"

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

const AnalysisList = () => {
  const [submissions, setSubmissions] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetchWithAuth("http://127.0.0.1:8000/research/submissions/");
        if (!response.ok) throw new Error("Failed to fetch submissions.");
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, []);

  const handleSoftDelete = async (id: number) => {
    const confirmDelete = window.confirm("Move this submission to Recently Deleted?");
    if (!confirmDelete) return;
  
    try {
      const response = await fetchWithAuth(`http://127.0.0.1:8000/research/submissions/delete/${id}/`, {
        method: "DELETE",
      });
  
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Your Analysis Submissions</h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((submission) => (
            <li key={submission.id} className="p-4 border rounded shadow">
              <h3 className="text-lg font-semibold">{submission.title}</h3>
              <p className="text-gray-700">{submission.description}</p>
              <button
                onClick={() => handleSoftDelete(submission.id)}
                className="bg-red-500 text-white px-4 py-2 mt-2 ml-2 rounded hover:bg-red-600"
              >
                Move to Recently Deleted
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AnalysisList;
