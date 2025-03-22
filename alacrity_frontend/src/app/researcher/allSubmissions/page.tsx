"use client"

import { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth"
import { useEffect, useState } from "react"
import parse from "html-react-parser"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation";

interface Analysis {
  id: number
  title: string
  description: string
  raw_results: string
  summary: string
  submitted_at?: string
  image?: string
  bookmark_count?: number;
}

const PublicSubmissions = () => {
  const [submissions, setSubmissions] = useState<Analysis[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [bookmarkedSubmissions, setBookmarkedSubmissions] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}research/submissions/view/`);
        if (!response.ok) throw new Error(`Failed to fetch submissions. Status: ${response.status}`);
  
        const data = await response.json();
  
        // Fetches all published submissions
        const allSubmissions = Array.isArray(data.all_published_submissions) ? data.all_published_submissions : [];
  
        setSubmissions(allSubmissions);
        setFilteredSubmissions(allSubmissions);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSubmissions();
  }, []);  

  useEffect(() => {
    const fetchBookmarks = async () => {
      const token = localStorage.getItem("access_token"); // Check if user is logged in
      if (!token) return; // Stop execution if general user
  
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}research/bookmarks/`);
        if (!response.ok) throw new Error("Failed to fetch bookmarks.");
  
        const data = await response.json();
        setBookmarkedSubmissions(data.map((bookmark: { id: number }) => bookmark.id));
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
      }
    };
  
    fetchBookmarks();
  }, []);
  

  // Handle search and filtering
  useEffect(() => {
    let result = [...submissions]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

// Apply sorting
if (sortBy === "recent") {
  result.sort((a, b) => {
    const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    return dateB - dateA;
  });
} else if (sortBy === "popular") {
  result.sort((a, b) => (b.bookmark_count || 0) - (a.bookmark_count || 0));
} else if (sortBy === "title") {
  result.sort((a, b) => a.title.localeCompare(b.title));
}


    setFilteredSubmissions(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, sortBy, submissions])

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  if (loading) return <p className="text-center text-gray-600">Loading submissions...</p>
  if (error) return <p className="text-center text-red-500">Error: {error}</p>

  // Calculate total pages
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const suffix = (day: number) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };
  
    return `${date.toLocaleDateString("en-UK", { weekday: "long" })}, ${day}${suffix(day)} ${date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
  };


  const toggleBookmark = async (submissionId: number) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}research/bookmark/${submissionId}/`, {
        method: "POST",
      });
  
      if (!response.ok) throw new Error("Failed to toggle bookmark.");
  
      const data = await response.json(); 

      // Extracts the updated bookmark status and count from the response
    const { bookmark_count } = data;
  
      setBookmarkedSubmissions((prev) =>
        data.bookmarked
          ? [...prev, submissionId]
          : prev.filter((id) => id !== submissionId)
      );

          // Updates the local state so the count doesnt require refreshing
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId ? { ...sub, bookmark_count } : sub
      )
    );
    setFilteredSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId ? { ...sub, bookmark_count } : sub
      )
    );
  
    } catch (error) {
      console.error("Bookmark error:", error);
    }
  };
  

  if (loading) return <p className="text-center text-gray-600">Loading submissions...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;


  return (
    <section className="py-12 bg-gray-50 dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-4xl font-bold text-gray-900 text-center mb-12 dark:text-gray-100">Public Analysis Submissions</div>

        {/* Search and Filter Controls */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full dark:bg-gray-700 dark:text-gray-100 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2" onClick={() => setSearchTerm("")}>
              {searchTerm && <span className="dark:text-gray-100 text-gray-500 hover:text-gray-700">✕</span>}
            </button>
          </div>

          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 dark:bg-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
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
            Showing {filteredSubmissions.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
            {Math.min(indexOfLastItem, filteredSubmissions.length)} of {filteredSubmissions.length} results
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-100">View:</span>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}
              aria-label="List view"
            >
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
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Submissions Grid/List */}
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "grid grid-cols-1 gap-8"
          }
        >
          {currentItems.length > 0 ? (
            currentItems.map((submission) => (
              <div
                key={submission.id}
                className="group  border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                {viewMode === "grid" ? (
                  // Grid view layout
                  <div className="flex flex-col h-full">
                    <div className="relative">
                      <img
                        src={submission.image || `https://picsum.photos/300/200?random=${submission.id}`}
                        alt={submission.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="ml-1">20 views</span>
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <span className="text-sm text-gray-400 mb-2">
                      {submission.submitted_at ? formatDate(submission.submitted_at) : "N/A"}
                      </span>
                      <div className="text-xl text-gray-900 font-medium leading-7 mb-2">{parse(submission.title)}</div>
                      <div className="text-gray-600 leading-6 mb-4 line-clamp-3 flex-grow">
                        {parse(submission.description)}
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        {/* Bookmark Icon */}
                        <div className="flex items-center">
              <button
                onClick={() => toggleBookmark(submission.id)}
                aria-label="Bookmark"
              >
                <Heart
                  size={24}
                  className={bookmarkedSubmissions.includes(submission.id) ? "fill-alacrityred text-alacrityred" : "text-gray-400"}
                />
              </button>
              {submission.bookmark_count && submission.bookmark_count > 0 && (
                  <span className="text-sm text-gray-600 ml-1">
                    {submission.bookmark_count}
                  </span>
                )}
                </div>
                        <button 
                        onClick={() => router.push(`/researcher/allSubmissions/view/${submission.id}`)}
                        className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List view layout
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 lg:w-1/4 relative">
                      <img
                        src={submission.image || `https://picsum.photos/300/200?random=${submission.id}`}
                        alt={submission.title}
                        className="w-full h-56 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                      />
                      <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="ml-1">20 views</span>
                      </span>
                    </div>
                    <div className="p-6 md:w-2/3 lg:w-3/4">
                      <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-400 dark:text-gray-200 mb-2">
                        {submission.submitted_at ? formatDate(submission.submitted_at) : "N/A"}
                        </span>
                      </div>
                      <div className="text-xl text-gray-900 dark:text-gray-100 font-medium leading-8 mb-3">{parse(submission.title)}</div>
                      <div className="text-gray-600 dark:text-gray-100 leading-6 mb-6 line-clamp-3">{parse(submission.description)}</div>
                      <div className="flex justify-between items-center">
                        {/* Bookmark Icon */}
                        <div className="flex items-center">
                        
              <button
                onClick={() => toggleBookmark(submission.id)}
                aria-label="Bookmark"
              >
                <Heart
                  size={24}
                  className={bookmarkedSubmissions.includes(submission.id) ? "fill-alacrityred text-alacrityred" : "text-gray-400"}
                />
              </button>
              {submission.bookmark_count && submission.bookmark_count > 0 && (
  <span className="text-sm text-gray-600 ml-1">
    {submission.bookmark_count}
  </span>
)}
</div>
                        <button 
                        onClick={() => router.push(`/researcher/allSubmissions/view/${submission.id}`)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-600 py-8 col-span-full">
              No submissions found matching your search criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredSubmissions.length > 0 && (
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
                // Show pages around current page
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
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
                )
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
  )
}

export default PublicSubmissions

