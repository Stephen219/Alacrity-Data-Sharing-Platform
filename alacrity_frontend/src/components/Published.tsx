"use client";
import React, { useMemo, useState, useEffect } from "react";
import parse from "html-react-parser";

interface Analysis {
  id: number;
  title: string;
  summary: string;
  status?: string;
  is_private?: boolean;
}

interface AnalysisListViewProps {
  submissions: Analysis[];
  sortOrder: "newest" | "oldest";
  setSortOrder: (order: "newest" | "oldest") => void;
  // Updated to pass is_private as an optional third argument.
  renderButtons: (id: number, status?: string, is_private?: boolean) => React.ReactNode;
  header: string;
}

const AnalysisListView = ({
  submissions,
  sortOrder,
  setSortOrder,
  renderButtons,
  header,
}: AnalysisListViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Safely parse HTML.
  const safeParse = (htmlContent: string | null | undefined) =>
    typeof htmlContent === "string" ? parse(htmlContent) : "";

  // Filter & sort.
  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerSearch) ||
          item.summary.toLowerCase().includes(lowerSearch)
      );
    }
    if (sortOrder === "newest") {
      result.sort((a, b) => b.id - a.id);
    } else {
      result.sort((a, b) => a.id - b.id);
    }
    return result;
  }, [submissions, searchTerm, sortOrder]);

  // Pagination calculations.
  const totalItems = filteredAndSortedSubmissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedSubmissions.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <section className="py-12 bg-gray-50 dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Page Title */}
        <h2
          data-testid="page-title"
          className="text-4xl font-bold text-gray-900 text-center mb-12 dark:text-gray-100"
        >
          {header}
        </h2>

        {/* Top Controls */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative w-full md:w-1/2">
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full dark:bg-gray-700 dark:text-gray-100 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                data-testid="clear-search"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-100"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Items Per Page */}
          <div className="flex gap-4">
            <select
              aria-label="Sort order"
              data-testid="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
              className="px-4 py-2 dark:bg-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <select
              aria-label="Items per page"
              data-testid="items-per-page-select"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              // Remove from accessibility tree so only one combobox is returned.
              role="none"
              tabIndex={-1}
              className="px-4 py-2 dark:bg-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={3}>3 per page</option>
              <option value={6}>6 per page</option>
              <option value={9}>9 per page</option>
            </select>
          </div>
        </div>

        {/* Results count and View toggle */}
        <div className="flex justify-between items-center mb-6">
          {totalItems > 0 && (
            <div data-testid="results-count" className="text-gray-600 dark:text-gray-100">
              {`Showing ${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, totalItems)} of ${totalItems} results`}
            </div>
          )}
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

        {/* Submissions List */}
        {totalItems === 0 ? (
          <div data-testid="no-submissions" className="text-center text-gray-600 py-8 dark:text-gray-100">
            No submissions found.
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                : "grid grid-cols-1 gap-8"
            }
          >
            {currentItems.map((submission) => (
              <div
                key={submission.id}
                className="group border border-gray-300 dark:border-gray-600 rounded-lg shadow-md transition-shadow duration-300 ease-in-out transform hover:shadow-xl hover:scale-105 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-500 hover:border-black dark:hover:border-white p-6 h-full"
              >
                <div className="grid grid-cols-[1fr_auto] gap-6 h-full">
                  {/* Left: Text container */}
                  <div className="overflow-y-auto max-h-40 whitespace-normal break-words pr-2">
                    <div data-testid="submission-title" className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      <span>{safeParse(submission.title)}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-100">
                      {safeParse(submission.summary)}
                    </div>
                  </div>
                  {/* Right: Buttons column */}
                  <div className="flex flex-col items-end justify-start gap-4">
                    {renderButtons(submission.id, submission.status, submission.is_private)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-1" aria-label="Pagination Navigation">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-orange-500 hover:bg-orange-50"}`}
                aria-label="Previous page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    currentPage === page ? "bg-orange-500 text-white" : "text-gray-700 dark:text-gray-100 hover:bg-orange-50"
                  }`}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-orange-500 hover:bg-orange-50"}`}
                aria-label="Next page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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

export default AnalysisListView;
