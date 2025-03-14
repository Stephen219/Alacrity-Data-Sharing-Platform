"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import { DatasetCard } from "@/components/all_datasets/datasetCard";

interface Bookmark {
  dataset_id: string;
  title: string;
  description: string;
  organization_name: string;
  category: string;
  created_at: string;
  tags?: string[];
  imageUrl?: string;
  size?: string;
  entries?: number;
  view_count?: number;
  price: number; 
}

interface ServerBookmarkData {
  dataset_id: string;
  title: string;
  description: string;
  organization_name?: string | null;
  category: string;
  created_at: string;
  tags?: string[] | null;
  imageUrl?: string | null;
  size?: string | null;
  entries?: number | null;
  price: number;
}


const ITEMS_PER_PAGE = 6;

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  //const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch the researchers/contributors bookmarks once on page load

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/bookmarks/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch bookmarks: ${response.status}`);
        }
        const data = (await response.json()) as ServerBookmarkData[];
  
        const mapped: Bookmark[] = data.map((item) => ({
          dataset_id: item.dataset_id,
          title: item.title,
          description: item.description,
          organization_name: item.organization_name ?? "No Organization",
          category: item.category,
          created_at: item.created_at,
          tags: item.tags ?? [],
          imageUrl: item.imageUrl ?? `https://picsum.photos/300/200?random=${item.dataset_id}`,
          size: item.size ?? "N/A",
          entries: item.entries ?? 0,
          price: item.price,  // Map price here
        }));
  
        setBookmarks(mapped);
      } catch (err) {
        console.error("Error loading bookmarks:", err);
        setError("Error loading bookmarks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchBookmarks();
  }, []);
  


  // Unbookmark function
  const handleUnbookmark = async (datasetId: string) => {
    try {
      // Immediately remove it from local state (optimistic update)
      setBookmarks((prev) => prev.filter((b) => b.dataset_id !== datasetId));

      // Call the toggle-bookmark endpoint
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/${datasetId}/bookmark/`, {
        method: "POST",
      });
      if (!response.ok) {
        // If the server call fails, revert local state or show an error
        throw new Error("Failed to toggle bookmark");
      }
    } catch (err) {
      console.error("Error unbookmarking dataset:", err);
      setError("Failed to unbookmark. Try again.");
    }
  };

  //Filter by search text
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      if (!searchQuery) return true;
      const lower = searchQuery.toLowerCase();
      return (
        bookmark.title.toLowerCase().includes(lower) ||
        bookmark.description.toLowerCase().includes(lower) ||
        (bookmark.tags ?? []).some((tag) => tag.toLowerCase().includes(lower))
      );
    });
  }, [bookmarks, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredBookmarks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredBookmarks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Render

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading bookmarks...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }

  if (bookmarks.length === 0) {
    return <div className="text-center mt-4">No bookmarks found.</div>;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 transition-colors duration-200"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text">
              My Bookmarked Datasets
            </h1>
            <p className="text-gray-600 text-lg">
              Quickly access (and unbookmark) your saved datasets
            </p>
          </div>
        </header>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="search"
            placeholder="Search bookmarks..."
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Grid/List toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              aria-label="Grid view"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 
                     012-2h2a2 2 0 012 2v2a2 2 0 
                     01-2 2H6a2 2 0 01-2-2V6zM14 
                     6a2 2 0 012-2h2a2 2 0 012 
                     2v2a2 2 0 01-2 2h-2a2 2 0 
                     01-2-2V6zM4 16a2 2 0 012-2h2a2 
                     2 0 012 2v2a2 2 0 01-2 2H6a2 
                     2 0 01-2-2v-2zM14 16a2 2 0 
                     012-2h2a2 2 0 012 2v2a2 2 0 
                     01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              aria-label="List view"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bookmarks Grid/List */}
        <div
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {currentItems.map((bookmark) => (
            <Link
              key={bookmark.dataset_id}
              href={`/datasets/details?id=${bookmark.dataset_id}`}
              className="block"
            >
            <DatasetCard
              dataset_id={bookmark.dataset_id}
              title={bookmark.title}
              description={bookmark.description}
              organization={bookmark.organization_name}
              dateUploaded={new Date(bookmark.created_at).toLocaleDateString()}
              imageUrl={bookmark.imageUrl ?? ""}
              tags={bookmark.tags ?? []}
              category={bookmark.category}
              entries={bookmark.entries ?? 0}
              size={bookmark.size ?? "N/A"}
              viewMode={viewMode}
              view_count={bookmark.view_count ?? 0}
              darkMode={false}
              isBookmarked={true}
              price={bookmark.price} 
              onToggleBookmark={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnbookmark(bookmark.dataset_id);
              }}
                />
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-orange-500 text-white"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
