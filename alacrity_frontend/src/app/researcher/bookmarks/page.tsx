"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";

interface Submission {
  id: number;
  title: string;
  description: string;
  submitted_at: string;
}

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetchWithAuth("http://127.0.0.1:8000/research/bookmarks/", {
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bookmarks.");
        }

        const data = await response.json();
        setBookmarks(data);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Your Bookmarked Research</h2>
      {bookmarks.length === 0 ? (
        <p>No bookmarks found.</p>
      ) : (
        <ul className="space-y-4">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="p-4 border rounded shadow">
              <h3 className="text-lg font-semibold">{bookmark.title}</h3>
              <p className="text-gray-700">{bookmark.description}</p>
              <p className="text-sm text-gray-500">Submitted on: {new Date(bookmark.submitted_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookmarkList;
