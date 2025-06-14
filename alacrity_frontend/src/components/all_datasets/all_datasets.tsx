



/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DatasetCard } from "./datasetCard";
import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";

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
  number_of_rows?: number;
  imageUrl?: string;
  price: number;
  view_count: number;
  darkMode: boolean;
  averageRating?: number;
  number_of_downloads?: number;
  has_access?: boolean;
  organization_id?: string;
  

}

const ITEMS_PER_PAGE = 6;

const DatasetsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchDatasetsAndFeedback = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const datasetsResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/all`);
      if (!datasetsResponse.ok) throw new Error(`HTTP Error: ${datasetsResponse.status}`);
      const data = await datasetsResponse.json();

      const mappedDatasets: Dataset[] = data.datasets.map((item: any) => ({
        ...item,
        size: item.size || "N/A",
        entries: item.number_of_rows || 0,
        imageUrl: item.imageUrl || `https://picsum.photos/300/200?random=${item.dataset_id}`,
        tags:
          typeof item.tags === "string"
            ? item.tags
                .split(",")
                .map((tag: string) => tag.trim())
                .filter((tag: string) => tag.trim() !== "")
            : item.tags || [],
        price: item.price ? Number(parseFloat(item.price).toFixed(2)) : 0,
        hasPaid: item.hasPaid || false,
        darkMode: false,
      }));

      const datasetsWithRatings = await Promise.all(
        mappedDatasets.map(async (dataset) => {
          try {
            const feedbackResponse = await fetchWithAuth(
              `${BACKEND_URL}/datasets/feedback/${dataset.dataset_id}/`
            );
            if (!feedbackResponse.ok) {
              if (feedbackResponse.status === 404) return { ...dataset, averageRating: 0 };
              throw new Error(`Feedback fetch failed: ${feedbackResponse.status}`);
            }
            const feedbackData = await feedbackResponse.json();
            const ratings = feedbackData.map((fb: any) => fb.rating);
            const averageRating =
              ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
            return { ...dataset, averageRating };
          } catch (err) {
            console.warn(`No rating for ${dataset.dataset_id}: ${err}`);
            return { ...dataset, averageRating: 0 };
          }
        })
      );

      setDatasets(datasetsWithRatings);

      const uniqueCategories = ["All", ...new Set(datasetsWithRatings.map((d) => d.category))];
      const uniqueOrgs = ["All", ...new Set(datasetsWithRatings.map((d) => d.organization_name || "No organization"))];
      const uniqueTags = ["All", ...new Set(datasetsWithRatings.flatMap((d) => d.tags))];
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
  }, []); // Empty deps since no external state is used

  const fetchUserRole = useCallback(async (): Promise<void> => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/users/profile/`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      const userData = await response.json();
      setUserRole(userData.role);
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  }, []);

  const fetchBookmarkedDatasets = useCallback(async (): Promise<void> => {
    try {
      console.log("Fetching bookmarked datasets...");
      const bookmarksResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/bookmarks/`);
      if (!bookmarksResponse.ok) {
        throw new Error(`Failed to fetch bookmarked datasets: ${bookmarksResponse.status}`);
      }
      const data = await bookmarksResponse.json();
      setBookmarkedDatasets(data.map((ds: { dataset_id: string }) => ds.dataset_id));
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("Error fetching bookmarks.");
    }
  }, []);

  useEffect(() => {
    fetchDatasetsAndFeedback();
    fetchUserRole();
  }, [searchParams, fetchDatasetsAndFeedback, fetchUserRole]);

  useEffect(() => {
    fetchBookmarkedDatasets();
  }, [fetchBookmarkedDatasets]);

  const toggleDatasetBookmark = useCallback(
    async (datasetId: string): Promise<void> => {
      const wasBookmarked = bookmarkedDatasets.includes(datasetId);
      const optimisticBookmarks = wasBookmarked
        ? bookmarkedDatasets.filter((id) => id !== datasetId)
        : [...bookmarkedDatasets, datasetId];

      setBookmarkedDatasets(optimisticBookmarks); 

      try {
        const bookmarkResponse = await fetchWithAuth(`${BACKEND_URL}/datasets/${datasetId}/bookmark/`, {
          method: "POST",
        });
        if (!bookmarkResponse.ok) throw new Error(`Failed to toggle bookmark: ${bookmarkResponse.status}`);
      } catch (error) {
        console.error("Dataset bookmark error:", error);
        setBookmarkedDatasets(bookmarkedDatasets); 
        setError("Failed to update bookmark. Please try again.");
      }
    },
    [bookmarkedDatasets]
  );

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

  const handleFilterChange = useCallback((categoryId: string, value: string): void => {
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
  }, []);

  const removeFilter = useCallback((categoryId: string, value: string): void => {
    setFilters((prev) => {
      const currentValues = prev[categoryId] || [];
      const newValues = currentValues.filter((v) => v !== value);
      return { ...prev, [categoryId]: newValues.length > 0 ? newValues : [] };
    });
    setCurrentPage(1);
  }, []);

  const toggleFilterCategory = useCallback((categoryId: string): void => {
    setActiveFilterCategory((prev) => (prev === categoryId ? null : categoryId));
  }, []);

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

        <div className="mb-6">
          {Object.entries(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).flatMap(([categoryId, values]) =>
                values.map((value) => (
                  <div
                    key={`${categoryId}-${value}`}
                    className="flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <span>
                      {filterCategories.find((c) => c.id === categoryId)?.label}: {value}
                    </span>
                    <button
                      onClick={() => removeFilter(categoryId, value)}
                      className="ml-2 text-red-500 hover:text-red-700"
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
{paginatedDatasets.length > 0 ? (
  paginatedDatasets.map((dataset) => (
    <div key={dataset.dataset_id} className="relative">
      <div className="cursor-pointer" onClick={() => {
        router.push(dataset.has_access 
          ? `/requests/detail/${dataset.dataset_id}` 
          : `/datasets/description?id=${dataset.dataset_id}`);
      }}>
        <DatasetCard
          dataset_id={dataset.dataset_id}
          title={dataset.title}
          description={dataset.description}
         
          organization={
            <span 
              className=" hover:underline cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation(); 
                router.push(`/organisation/profile/${dataset.organization_id}`);
              }}
            >
              {dataset.organization_name}
            </span>
          }
          dateUploaded={new Date(dataset.created_at).toLocaleDateString()}
         
          imageUrl={dataset.imageUrl || `https://picsum.photos/300/200?random=${dataset.dataset_id}`}
          tags={dataset.tags}
          category={dataset.category}
          entries={dataset.number_of_rows || 0}
          size={dataset.size || "N/A"}
          view_count={dataset.view_count}
          extraActions={() => toggleDatasetBookmark(dataset.dataset_id)}
          isBookmarked={bookmarkedDatasets.includes(dataset.dataset_id)}
          onToggleBookmark={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDatasetBookmark(dataset.dataset_id);
          }}
          viewMode={viewMode}
          darkMode={dataset.darkMode}
          price={dataset.price}
          averageRating={dataset.averageRating}
        />
      </div>
    </div>
  ))
) : searchParams.get("org") ? (
            <div className="col-span-full text-center py-8">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                This organization has absolutely zero datasets.
              </p>
              <Link href="/datasets/all">
                <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Explore All Datasets
                </button>
              </Link>
            </div>
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-lg text-gray-600 dark:text-gray-300">No datasets match your filters.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && paginatedDatasets.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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