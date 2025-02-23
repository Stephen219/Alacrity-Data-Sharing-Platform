

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { BACKEND_URL } from "@/config";
import { fetchWithAuth } from "@/libs/auth";
import { DatasetCard } from "@/components/all_datasets/datasetCard";

// Types
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
  company?: string;
  type?: string;
  disease?: string;
}

// Filter categories based on real data
const FILTER_CATEGORIES = [
  {
    id: "category",
    label: "Category",
    options: ["All", "category1", "category2"],
  },
  {
    id: "organization_name",
    label: "Organization",
    options: ["All", "No organization"],
  },
  {
    id: "dateAdded",
    label: "Date Added",
    options: ["All Time", "Today", "This Week", "This Month", "This Year"],
  },
];

function DatasetsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const fetchDatasets = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/datasets/all`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();

      const mappedDatasets: Dataset[] = data.datasets.map((item: any) => ({
        dataset_id: item.dataset_id,
        title: item.title,
        contributor_name: item.contributor_name,
        organization_name: item.organization_name,
        description: item.description, // We'll truncate this in the render
        tags: item.tags,
        category: item.category,
        created_at: item.created_at,
        analysis_link: item.analysis_link,
        updated_at: item.updated_at,
        size: "N/A", // Default value, not in real data
        entries: 0, // Default value, not in real data
        imageUrl: `https://picsum.photos/300/200?random=${item.dataset_id}`, // Dynamic environmental image
        company: item.organization_name !== "No organization" ? item.organization_name : "Unknown",
        type: "Tabular",
        disease: "N/A",
      }));

      setDatasets(mappedDatasets);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Error fetching datasets: ${err}`);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        searchQuery === "" ||
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (value === "All" || value === "") return true;
        if (key === "dateAdded") {
          const dateMap: Record<string, (date: string) => boolean> = {
            Today: (date) => new Date(date).toDateString() === new Date().toDateString(),
            "This Week": (date) => new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            "This Month": (date) =>
              new Date(date).getMonth() === new Date().getMonth() &&
              new Date(date).getFullYear() === new Date().getFullYear(),
            "This Year": (date) => new Date(date).getFullYear() === new Date().getFullYear(),
          };
          return dateMap[value](dataset.created_at);
        }
        if (key === "organization") return dataset.contributor_name === value;
        return dataset[key as keyof Dataset] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [searchQuery, filters, datasets]);

  const paginatedDatasets = filteredDatasets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredDatasets.length / itemsPerPage);

  const handleFilterChange = (categoryId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [categoryId]: value }));
    setCurrentPage(1);
  };

  const toggleFilterCategory = (categoryId: string) => {
    setActiveFilterCategory(activeFilterCategory === categoryId ? null : categoryId);
  };

  // Truncate long descriptions to prevent layout issues
  const truncateDescription = (description: string, maxLength: number = 200) => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength) + "...";
    }
    return description;
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-transparent bg-clip-text">
              Explore Datasets
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover and analyze high-quality datasets from trusted organizations
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group mb-6">
          <input
            type="search"
            placeholder="Search datasets by name, description, or tags..."
            className="w-full px-6 py-4 rounded-2xl border-2 focus:outline-none focus:border-primary/30 pl-14 pr-4 transition-all duration-200 bg-background shadow-sm hover:shadow-md focus:shadow-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="absolute left-4 top-4 h-6 w-6 text-primary/60 group-hover:text-primary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleFilterCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilterCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {activeFilterCategory && (
            <div className="bg-background border rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-2">
                {FILTER_CATEGORIES.find((c) => c.id === activeFilterCategory)?.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {FILTER_CATEGORIES.find((c) => c.id === activeFilterCategory)?.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleFilterChange(activeFilterCategory, option)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters[activeFilterCategory] === option
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/30">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dataset Grid/List */}
        <div
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {paginatedDatasets.map((dataset) => (
            <DatasetCard
              key={dataset.dataset_id}
              title={dataset.title || "book"} // Fallback to "book" from screenshot
              description={truncateDescription(dataset.description || "python manage.py makemigrations --emptypython manage.py makemigrations --emptypython manage.py makemigrations --emptypython manage.py makemigrations --...")} // Truncate long descriptions
              organization={dataset.organization_name || "No organization"} // Use real data or fallback
              dateUploaded={dataset.created_at ? new Date(dataset.created_at).toLocaleDateString() : "22/02/2025"} // Use real date or fallback from screenshot
              imageUrl={dataset.imageUrl || `https://picsum.photos/300/200?random=${dataset.dataset_id}`} // Use environmental image
              tags={dataset.tags.length > 0 ? dataset.tags : ["Climate", "Environmental", "Global"]} // Use real tags or fallback
              category={dataset.category || "category1"} // Use real category or fallback from screenshot
              entries={dataset.entries || 150000} // Default to 150,000 entries
              size={dataset.size || "N/A"} // Default to "N/A" or update to "2.5GB" if needed
              viewMode={viewMode}
              darkMode={isDarkMode}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-1" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  currentPage === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && <div className="text-red-500 text-center mt-4">{error}</div>}
      </div>
    </div>
  );
}

export default DatasetsPage;

// Helper function to truncate long descriptions
function truncateDescription(description: string, maxLength: number = 200) {
  if (description.length > maxLength) {
    return description.substring(0, maxLength) + "...";
  }
  return description;
}