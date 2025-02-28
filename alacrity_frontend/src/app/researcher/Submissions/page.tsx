"use client"

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import parse from "html-react-parser";
import { Button } from "@/components/ui/button";

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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");


  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(
          `http://127.0.0.1:8000/research/submissions/?sort=${sortOrder}}`
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
  }, [sortOrder,]); 
  
  

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
    <>
<div className="flex justify-end mt-24">
  <select
    id="sortOrder"
    className="border p-2 rounded hover:bg-gray-100 hover:border-black rounded-lg"
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
  >
    <option value="newest">Sort: Newest</option>
    <option value="oldest">Sort: Oldest</option>
  </select>
</div>
    <div className="py-2 mx-auto text-center items-center max-w-3xl">
      <h2 className="text-2xl font-bold sm:text-5xl tracking-tight mb-16 ">My Research
      </h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul className="space-y-8">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="h-64 border rounded-lg p-6 gap-8 flex justify-between bg-white hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-50 hover:border-black">
              <div className="overflow-auto scrollbar-custom">
              <div className="text-lg font-semibold text-gray-800 transition-colors duration-300 ease-in-out">
                {parse(submission.title)}
              </div>
              <div className="text-gray-600">
                {parse(submission.summary)}
              </div>
              </div>
              <div className="flex flex-col gap-32">
              <Button
                onClick={() => handleSoftDelete(submission.id)}
                className=" transition-transform transform hover:scale-110 hover:bg-orange-400 duration-300 ease-in-out">
                Delete
              </Button>
              <Button className= "" variant="outline">Read </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  );
};

export default AnalysisList;
