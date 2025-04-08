"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Grid, List, ArrowUpDown, ChevronDown } from "lucide-react"
import { DatasetCard } from "./datasetCard"
import { fetchWithAuth } from "@/libs/auth"
import { BACKEND_URL } from "@/config"
import Link from "next/link"

interface Dataset {
  dataset_id: string
  title: string
  description: string
  organization: string
  updated_at: string
  tags: string
  category: string
  entries?: number
  size?: string
  isBookmarked?: boolean
  price?: number
  view_count: number
}

export default function DatasetAccessed() {

  const [datasets, setDatasets] = useState<Dataset[]>([
    
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"title" | "date" | "category" | "entries">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>(datasets)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/users/datasetsWithAccess/`)
        if (!response.ok) throw new Error('Failed to fetch datasets')
        const data = await response.json()
        console.log("Fetched datasets:", data);
        
        setDatasets(data)
      } catch (error) {
        console.error('Error fetching datasets:', error)
      }
    }
    
    fetchDatasets()
  }, [])
  

  
  useEffect(() => {
    let result = [...datasets]

   
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (dataset) =>
          dataset.title.toLowerCase().includes(query) ||
          dataset.description.toLowerCase().includes(query) ||
          dataset.tags.toLowerCase().includes(query) ||
          dataset.category.toLowerCase().includes(query) ||
          dataset.organization.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "title") {
        return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      } else if (sortBy === "date") {
        return sortDirection === "asc"
          ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      } else if (sortBy === "category") {
        return sortDirection === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
      } else if (sortBy === "entries") {
        const entriesA = a.entries || 0
        const entriesB = b.entries || 0
        return sortDirection === "asc" ? entriesA - entriesB : entriesB - entriesA
      }
      return 0
    })

    setFilteredDatasets(result)
  }, [datasets, searchQuery, sortBy, sortDirection])

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }


  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

 
  const handleSort = (field: "title" | "date" | "category" | "entries") => {
    if (sortBy === field) {
      toggleSortDirection()
    } else {
      setSortBy(field)
      setSortDirection("asc")
    }
    setDropdownOpen(false)
  }

 
  const handleToggleBookmark = (datasetId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    setDatasets((prevDatasets) =>
      prevDatasets.map((dataset) =>
        dataset.dataset_id === datasetId ? { ...dataset, isBookmarked: !dataset.isBookmarked } : dataset,
      ),
    )
  }


  return (
    <div className="bg-card text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0" style={{ color: "#f97316" }}>
           All Datasets you have access to
          </h1>

        </div>

        {/* Search and controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-500 dark:text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-between px-4 py-2 rounded-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{ borderColor: "#f97316", color: "#f97316" }}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>
                  Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  {sortDirection === "asc" ? " (A-Z)" : " (Z-A)"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleSort("title")}
                      className="block px-4 py-2 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700  font-semibold"
                      >
                      Title
                    </button>
                    <button
                      onClick={() => handleSort("date")}
                      className="block px-4 py-2 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700  font-semibold"
                    >
                      Date Updated
                    </button>
                    <button
                      onClick={() => handleSort("category")}
                      className="block px-4 py-2 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700  font-semibold"
                    >
                      Category
                    </button>
                    <button
                      onClick={() => handleSort("entries")}
                      className="block px-4 py-2 text-sm w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700  font-semibold"
                    >
                      Number of Entries
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View toggle */}
            <div
              className="flex border rounded-md overflow-hidden border-gray-300 dark:border-gray-700">
              <button
                className={`px-3 py-2 ${
                  viewMode === "grid"
                  ? "bg-[#f97316] text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={`px-3 py-2 ${
                  viewMode === "list"
                  ? "bg-[#f97316] text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

       
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Showing {filteredDatasets.length} of {datasets.length} datasets
        </p>

       
        {filteredDatasets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No datasets found matching your search criteria.
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredDatasets.map((dataset, index) => (
  <Link
    key={`${dataset.dataset_id}-${index}`} // Ensure key is unique by combining dataset_id with the index
    href={`/analyze/${dataset.dataset_id}`} // Use the dataset_id as the URL parameter
  >
    <DatasetCard
      dataset_id={dataset.dataset_id}
      title={dataset.title}
      description={dataset.description}
      organization={dataset.organization}
      dateUploaded={formatDate(dataset.updated_at)}
      imageUrl={`https://picsum.photos/seed/${dataset.dataset_id}/800/450`}
      tags={Array.isArray(dataset.tags) ? dataset.tags : dataset.tags.split(",").map((tag) => tag.trim())}
      category={dataset.category}
      entries={dataset.entries || 0}
      size={dataset.size || "0"}
      viewMode={viewMode}
      darkMode={true}
      view_count={dataset.view_count}
      isBookmarked={dataset.isBookmarked || false}
      price={dataset.price || 0}
      onToggleBookmark={(e) => handleToggleBookmark(dataset.dataset_id, e)}
    />
  </Link>
))}
          
          </div>
        )}
      </div>
    </div>
  )
}

