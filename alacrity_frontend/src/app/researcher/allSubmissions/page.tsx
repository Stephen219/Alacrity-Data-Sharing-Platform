"use client";

import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import parse from "html-react-parser";

interface Analysis {
  id: number;
  title: string;
  description: string;
  raw_results: string;
  summary: string;
  submitted_at?: string;
  image?: string;
}

const PublicSubmissions = () => {
  const [recentSubmissions, setRecentSubmissions] = useState<Analysis[]>([]);
  const [popularSubmissions, setPopularSubmissions] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleBookmark = async (submissionId: number) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}research/bookmark/${submissionId}/`, {
        method: "POST",
      });

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Bookmark error:", error);
    }
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/research/submissions/view/");
        if (!response.ok) throw new Error(`Failed to fetch submissions. Status: ${response.status}`);

        const data = await response.json();

        setRecentSubmissions(Array.isArray(data.recent_submissions) ? data.recent_submissions : []);
        setPopularSubmissions(Array.isArray(data.popular_submissions) ? data.popular_submissions : []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <p className="text-center text-gray-600">Loading submissions...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Public Analysis Submissions</h2>

        {/* Recently Uploaded Section */}
        <h3 className="text-3xl font-semibold mb-8 text-center">Recently Uploaded</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentSubmissions.map((submission) => (
            <div key={submission.id} className="group border border-gray-300 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <img
                  src={submission.image || "https://via.placeholder.com/500"}
                  alt={submission.title}
                  className="rounded-t-2xl w-full object-cover h-56"
                />
              </div>
              <div className="p-4 lg:p-6 transition-all duration-300 rounded-b-2xl group-hover:bg-gray-50">
                <span className="text-indigo-600 font-medium mb-3 block">
                  {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "N/A"}
                </span>
                <h4 className="prose text-xl text-gray-900 font-medium leading-8 mb-5">{parse(submission.title)}</h4>
                <div className="prose text-gray-500 leading-6 mb-10">{parse(submission.description)}</div>
                <button 
                  onClick={() => toggleBookmark(submission.id)}
                  className="text-lg text-indigo-600 font-semibold"
                >
                  Bookmark
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Most Popular Section */}
        <h3 className="text-3xl font-semibold mt-16 mb-8 text-center">Most Popular</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularSubmissions.map((submission) => (
            <div key={submission.id} className="group border border-gray-300 rounded-2xl shadow-lg">
              <div className="flex items-center">
                <img
                  src={submission.image || "https://via.placeholder.com/500"}
                  alt={submission.title}
                  className="rounded-t-2xl w-full object-cover h-56"
                />
              </div>
              <div className="p-4 lg:p-6 transition-all duration-300 rounded-b-2xl group-hover:bg-gray-50">
                <span className="text-indigo-600 font-medium mb-3 block">
                  {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "N/A"}
                </span>
                <h4 className="text-xl text-gray-900 font-medium leading-8 mb-5">{parse(submission.title)}</h4>
                <div className="text-gray-500 leading-6 mb-10">{parse(submission.description)}</div>
                <button 
                  onClick={() => toggleBookmark(submission.id)}
                  className="text-lg text-indigo-600 font-semibold"
                >
                  Bookmark
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicSubmissions;
