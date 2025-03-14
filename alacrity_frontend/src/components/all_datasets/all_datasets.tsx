/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DatasetCard } from "./datasetCard";
import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";

interface Dataset {
  dataset_id: string;
  title: string;
  contributor_name: string;
  organization_name: string;
  description: string;
  tags: string[];
  category: string;
  created_at: string;
  analysis_link: string | null;
  updated_at: string;
  size?: string;
  entries?: number;
  imageUrl?: string;
  price: number;
  view_count: number;
  darkMode: boolean;
}

const ITEMS_PER_PAGE = 6;

const DatasetsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategories, setFilterCategories] = useState<
    { id: string; label: string; options: string[] }[]
  >([]);
  const [bookmarkedDatasets, setBookmarkedDatasets] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/all`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
  
        const mappedDatasets: Dataset[] = data.datasets.map((item: any) => ({
          ...item,
          size: item.size || "N/A",
          entries: item.entries || 0,
          imageUrl: item.imageUrl || `https://picsum.photos/300/200?random=${item.dataset_id}`,
          tags: typeof item.tags === "string"
            ? item.tags
                .split(",")
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.trim() !== "")
            : item.tags || [],
            price: item.price || 0,
        }));
  
        setDatasets(mappedDatasets);
  
        const uniqueCategories = ["All", ...new Set(mappedDatasets.map((d) => d.category))];
        const uniqueOrgs = ["All", ...new Set(mappedDatasets.map((d) => d.organization_name || "No organization"))];
        const uniqueTags = ["All", ...new Set(mappedDatasets.flatMap((d) => d.tags))];
        const staticDateOptions = ["All Time", "Today", "This Week", "This Month", "This Year"];
  
        setFilterCategories([
          { id: "category", label: "Category", options: uniqueCategories },
          { id: "organization_name", label: "Organization", options: uniqueOrgs },
          { id: "tags", label: "Tags", options: uniqueTags },
          { id: "dateAdded", label: "Date Added", options: staticDateOptions },
        ]);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Error fetching datasets: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDatasets();
  }, []);
  
  /**
   * Fetches the datasets bookmarked by the researcher/contributor.
   */
  const fetchBookmarkedDatasets = async () => {
    try {
      console.log("Fetching bookmarked datasets...");
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/bookmarks/`);

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarked datasets: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bookmarked datasets response:", data);

      /**
       * Extract only the dataset IDs from the response.
       * This allows us to efficiently check which datasets are bookmarked
       * without needing to store all dataset details.
       */
      setBookmarkedDatasets(data.map((ds: { dataset_id: string }) => ds.dataset_id));

    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Error fetching bookmarks.");
    }
  };

  // Ensures that the user's bookmarks are loaded when they visit the page.
  useEffect(() => {
    const loadAll = async () => {
      await fetchBookmarkedDatasets();
    };
    loadAll();
  }, []);

  // Toggles the bookmark status of a dataset for researcher/contributor
  const toggleDatasetBookmark = async (datasetId: string) => {
    try {
      setBookmarkedDatasets((prev) =>
        prev.includes(datasetId)
          ? prev.filter((id) => id !== datasetId)
          : [...prev, datasetId]
      );

      const response = await fetchWithAuth(
        `${BACKEND_URL}/datasets/${datasetId}/bookmark/`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Failed to toggle bookmark");
    } catch (error) {
      console.error("Dataset bookmark error:", error);
    }
  };

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        searchQuery === "" ||
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  
      const matchesFilters = Object.entries(filters).every(([key, values]) => {
        const safeValues = Array.isArray(values) ? values : [];
        if (safeValues.length === 0 || safeValues.includes("All") || safeValues.includes("All Time")) return true;
        if (key === "dateAdded") {
          const dateMap: Record<string, (date: string) => boolean> = {
            Today: (date) => new Date(date).toDateString() === new Date().toDateString(),
            "This Week": (date) => new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            "This Month": (date) =>
              new Date(date).getMonth() === new Date().getMonth() &&
              new Date(date).getFullYear() === new Date().getFullYear(),
            "This Year": (date) => new Date(date).getFullYear() === new Date().getFullYear(),
          };
          return safeValues.some((value) => dateMap[value]?.(dataset.created_at));
        }
        if (key === "organization_name") return safeValues.includes(dataset.organization_name);
        if (key === "category") return safeValues.includes(dataset.category);
        if (key === "tags") return safeValues.some((value) => dataset.tags.includes(value));
        return true;
      });
  
      return matchesSearch && matchesFilters;
    });
  }, [searchQuery, filters, datasets]);

  const paginatedDatasets = filteredDatasets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredDatasets.length / ITEMS_PER_PAGE);

  const handleFilterChange = (categoryId: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[categoryId] || [];
      if (value === "All" || value === "All Time") {
        return { ...prev, [categoryId]: [value] };
      }
      if (currentValues.includes(value)) {
        const newValues = currentValues.filter((v) => v !== value);
        return { ...prev, [categoryId]: newValues.length > 0 ? newValues : [] };
      }
      return { ...prev, [categoryId]: [...currentValues.filter((v) => v !== "All" && v !== "All Time"), value] };
    });
    setCurrentPage(1);
  };

  const removeFilter = (categoryId: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[categoryId] || [];
      const newValues = currentValues.filter((v) => v !== value);
      return { ...prev, [categoryId]: newValues.length > 0 ? newValues : [] };
    });
    setCurrentPage(1);
  };

  const toggleFilterCategory = (categoryId: string) => {
    setActiveFilterCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading datasets...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-card transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text">
              Explore Datasets
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover and analyze high-quality datasets from trusted organizations
            </p>
          </div>
        </header>

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search datasets..."
            className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:outline-white dark:border-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Display Selected Filters */}
        <div className="mb-6">
          {Object.entries(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).flatMap(([categoryId, values]) =>
                values.map((value) => (
                  <div
                    key={`${categoryId}-${value}`}
                    className="flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                  
                    <span>
                      {filterCategories.find((c) => c.id === categoryId)?.label}: {value}
                    </span>
                    <button
                      onClick={() => removeFilter(categoryId, value)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      aria-label={`Remove ${value} from ${categoryId} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {filterCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleFilterCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilterCategory === category.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {activeFilterCategory && (
            <div className="rounded-lg p-4 bg-white shadow-md">
              <h3 className="font-semibold mb-2">
                {filterCategories.find((c) => c.id === activeFilterCategory)?.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {filterCategories
                  .find((c) => c.id === activeFilterCategory)
                  ?.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange(activeFilterCategory, option)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        (filters[activeFilterCategory] || []).includes(option)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
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

        <div
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {paginatedDatasets.map((dataset) => (
            <Link
              key={dataset.dataset_id}
              href={`/datasets/description?id=${dataset.dataset_id}`} 
              className="block" 
            >
              <DatasetCard
                dataset_id={dataset.dataset_id}
                title={dataset.title}
                description={dataset.description}
                organization={dataset.organization_name}
                dateUploaded={new Date(dataset.created_at).toLocaleDateString()}
                imageUrl={dataset.imageUrl || ""}
                tags={dataset.tags}
                category={dataset.category}
                entries={dataset.entries || 0}
                size={dataset.size || "N/A"}
                view_count={dataset.view_count}
                extraActions={() => toggleDatasetBookmark(dataset.dataset_id)}
                isBookmarked={bookmarkedDatasets.includes(dataset.dataset_id)}
                onToggleBookmark={() => toggleDatasetBookmark(dataset.dataset_id)}
                viewMode={viewMode}
                darkMode={darkMode}
                price={dataset.price}
              />
            </Link>
          ))}
        </div>

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
                    currentPage === page ? "bg-orange-500 text-white" : "hover:bg-gray-200 dark:hover:bg-gray-700"
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
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetsPage;