

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { DatasetCard } from "./datasetCard"
import { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth"

interface Dataset {
  dataset_id: string
  title: string
  contributor_name: string
  organization_name: string
  description: string
  tags: string[]
  category: string
  created_at: string
  analysis_link: string | null
  updated_at: string
  size?: string
  entries?: number
  imageUrl?: string
}

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
]

const ITEMS_PER_PAGE = 6

const DatasetsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        // Simulating API call
        const response = await fetchWithAuth(`${BACKEND_URL}/datasets/all`) 
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
        const data = await response.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedDatasets: Dataset[] = data.datasets.map((item: any) => ({
          ...item,
          size: item.size || "N/A",
          entries: item.entries || 0,
          imageUrl: item.imageUrl || `https://picsum.photos/300/200?random=${item.dataset_id}`,
        }))

        setDatasets(mappedDatasets)
      } catch (err) {
        console.error("Fetch error:", err)
        setError(`Error fetching datasets: ${err}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDatasets()
  }, [])

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)
    document.documentElement.classList.toggle("dark", prefersDark)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
    document.documentElement.classList.toggle("dark")
  }

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        searchQuery === "" ||
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (value === "All" || value === "") return true
        if (key === "dateAdded") {
          const dateMap: Record<string, (date: string) => boolean> = {
            Today: (date) => new Date(date).toDateString() === new Date().toDateString(),
            "This Week": (date) => new Date(date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            "This Month": (date) =>
              new Date(date).getMonth() === new Date().getMonth() &&
              new Date(date).getFullYear() === new Date().getFullYear(),
            "This Year": (date) => new Date(date).getFullYear() === new Date().getFullYear(),
          }
          return dateMap[value](dataset.created_at)
        }
        if (key === "organization_name") return dataset.organization_name === value
        return dataset[key as keyof Dataset] === value
      })

      return matchesSearch && matchesFilters
    })
  }, [searchQuery, filters, datasets])

  const paginatedDatasets = filteredDatasets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalPages = Math.ceil(filteredDatasets.length / ITEMS_PER_PAGE)

  const handleFilterChange = (categoryId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [categoryId]: value }))
    setCurrentPage(1)
  }

  const toggleFilterCategory = (categoryId: string) => {
    setActiveFilterCategory((prev) => (prev === categoryId ? null : categoryId))
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading datasets...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text">
              Explore Datasets
            </h1>
            <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Discover and analyze high-quality datasets from trusted organizations
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? "🌞" : "🌙"}
          </button>
        </header>

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search datasets..."
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleFilterCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilterCategory === category.id
                    ? "bg-orange-500 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {activeFilterCategory && (
            <div className={`rounded-lg p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-md`}>
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
                        ? "bg-orange-500 text-white"
                        : isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
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
            <DatasetCard
              key={dataset.dataset_id}
              title={dataset.title}
              description={dataset.description}
              organization={dataset.organization_name}
              dateUploaded={new Date(dataset.created_at).toLocaleDateString()}
              imageUrl={dataset.imageUrl || ""}
              tags={dataset.tags}
              category={dataset.category}
              entries={dataset.entries || 0}
              size={dataset.size || "N/A"}
              viewMode={viewMode}
              darkMode={isDarkMode}
            />
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
  )
}

export default DatasetsPage



