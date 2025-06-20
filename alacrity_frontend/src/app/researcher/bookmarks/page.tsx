"use client";

import { fetchWithAuth } from "@/libs/auth";
import { useEffect, useState } from "react";
import parse from "html-react-parser"
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

interface Bookmark {
  id: number;
  title: string;
  summary: string;
  //status?: string;
}

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const router = useRouter();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/research/bookmarks/`);
        if (!response.ok) throw new Error("Failed to fetch bookmarks.");
        const data = await response.json();
        setBookmarks(data);
        setFilteredBookmarks(data);
      } catch (err) {
        setError((err as Error).message);
      }finally {

        setLoading(false);

      }
    };

    fetchBookmarks();
  }, []);

   // Filter and sort bookmarks when search term, sort option, or bookmarks change
   useEffect(() => {
    let result = [...bookmarks];
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === "recent") {
      // Assumes higher id = more recent
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === "oldest") {
      result.sort((a, b) => a.id - b.id);
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    setFilteredBookmarks(result);
    setCurrentPage(1);
  }, [searchTerm, sortBy, bookmarks]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookmarks.slice(indexOfFirstItem, indexOfLastItem);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Toggle bookmark (unbookmark) action
  const toggleBookmark  = async (bookmarkId: number) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/research/bookmark/${bookmarkId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unbookmark.");
      }

      // Remove bookmark from state upon successful unbookmarking
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
      setFilteredBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
    } catch (error) {
      console.error("Error unbookmarking:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="py-12 bg-gray-50 dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6" data-testid="published-component">
        <div className="text-4xl font-bold text-gray-900 text-center mb-12 dark:text-gray-100">
          Your Liked Research
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full dark:bg-gray-700 dark:text-gray-100 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchTerm("")}
              >
                <span className="dark:text-gray-100 text-gray-500 hover:text-gray-700">✕</span>
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 dark:bg-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title (A-Z)</option>
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-2 dark:bg-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={3}>3 per page</option>
              <option value={6}>6 per page</option>
              <option value={9}>9 per page</option>
            </select>
          </div>
        </div>

        {/* Results count and view toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600 dark:text-gray-100">
            Showing {filteredBookmarks.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
            {Math.min(indexOfLastItem, filteredBookmarks.length)} of {filteredBookmarks.length} results
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-100">View:</span>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}
              aria-label="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${viewMode === "grid" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}
              aria-label="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Bookmarks Grid/List */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "grid grid-cols-1 gap-8"}>
          {currentItems.length > 0 ? (
            currentItems.map((bookmark) => (
              <div
                key={bookmark.id}
                data-testid="bookmark-item"
                className="group border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                {viewMode === "grid" ? (
                  <div className="flex flex-col h-full">
                    <div className="relative">
                      <img
                        src={`https://picsum.photos/300/200?random=${bookmark.id}`}
                        alt={bookmark.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="text-xl text-gray-900 font-medium leading-7 mb-2 dark:text-gray-100">{parse(bookmark.title)}</div>
                      <div className="text-gray-600 dark:text-gray-100 leading-6 mb-4 line-clamp-3 flex-grow">
                        {parse(bookmark.summary)}
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center">
                          <button onClick={() => toggleBookmark(bookmark.id)} aria-label="Unbookmark">
                            <Heart size={24} className="fill-alacrityred text-alacrityred" />
                          </button>
                        </div>
                        <Button onClick={() => router.push(`/researcher/bookmarks/view/${bookmark.id}`)}>
                          Read
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 lg:w-1/4 relative">
                      <img
                        src={`https://picsum.photos/300/200?random=${bookmark.id}`}
                        alt={bookmark.title}
                        className="w-full h-56 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                      />
                    </div>
                    <div className="p-6 md:w-2/3 lg:w-3/4">
                      <div className="text-xl text-gray-900 dark:text-gray-100 font-medium leading-8 mb-3">
                        {parse(bookmark.title)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-100 leading-6 mb-6 line-clamp-3">
                        {parse(bookmark.summary)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <button onClick={() => toggleBookmark(bookmark.id)} aria-label="Unbookmark">
                            <Heart size={24} className="fill-alacrityred text-alacrityred" />
                          </button>
                        </div>
                        <Button
                          onClick={() => {
                            console.log(`Navigating to /researcher/bookmarks/view/${bookmark.id}`);
                            router.push(`/researcher/bookmarks/view/${bookmark.id}`);
                          }}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                        >
                          Read
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-600 py-8 col-span-full">
              No bookmarks found matching your search criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredBookmarks.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-1">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-orange-500 hover:bg-orange-50"
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${
                      currentPage === pageNum ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-orange-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => paginate(totalPages)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-700 hover:bg-orange-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-orange-500 hover:bg-orange-50"
                }`}
              >
                <span className="sr-only">Next</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
};

export default BookmarkList;
