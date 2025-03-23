"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import Published from "@/components/Published";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface Bookmark {
  id: number;
  title: string;
  summary: string;
  status?: string;
}

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const router = useRouter();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetchWithAuth("http://127.0.0.1:8000/research/bookmarks/");
        if (!response.ok) throw new Error("Failed to fetch bookmarks.");
        const data = await response.json();
        setBookmarks(data);
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, []);

  const handleUnbookmark = async (id: number) => {
    try {
      const response = await fetchWithAuth(`http://127.0.0.1:8000/research/bookmark/${id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unbookmark.");
      }

      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
      console.log(`Successfully unbookmarked submission with ID: ${id}`);
    } catch (error) {
      console.error("Error unbookmarking:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Published
      header="Your Liked Research"
      submissions={bookmarks}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      renderButtons={(id) => (
        <>
        <div className="flex flex-col items-center gap-36">
        <button
          onClick={() => handleUnbookmark(id)}
          aria-label="Unbookmark"
        >
          <Heart size={24} className="fill-alacrityred text-alacrityred hover:fill-white hover:text-gray-400" />
        </button>

<Button 
onClick={() => router.push(`/researcher/bookmarks/view/${id}`)}
className="hover:bg-orange-400 transition">
Read
</Button>
</div>
</>
      )}
    />
  );
};

export default BookmarkList;
